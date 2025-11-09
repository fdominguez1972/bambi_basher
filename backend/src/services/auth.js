import crypto from 'crypto';
import { query, get, run } from '../db/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

// Session configuration
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a cryptographically secure session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get current timestamp in seconds (Unix time)
 * @returns {number}
 */
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Create a new user
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @param {string} role - User role ('admin' or 'user')
 * @returns {Promise<Object>} Created user (without password)
 */
export async function createUser(username, password, role = 'user') {
  // Validate input
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required');
  }

  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  if (!['admin', 'user'].includes(role)) {
    throw new Error('Role must be either "admin" or "user"');
  }

  // Check if username already exists
  const existing = get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    throw new Error('Username already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = run(
    'INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)',
    [username, passwordHash, role, getCurrentTimestamp()]
  );

  // Return user without password
  return {
    id: result.lastInsertRowid,
    username,
    role,
    created_at: getCurrentTimestamp()
  };
}

/**
 * Authenticate user with username and password
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
export async function authenticateUser(username, password) {
  if (!username || !password) {
    return null;
  }

  // Get user from database
  const user = get(
    'SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?',
    [username]
  );

  if (!user) {
    return null;
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  // Update last login
  run('UPDATE users SET last_login = ? WHERE id = ?', [getCurrentTimestamp(), user.id]);

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Create a new session for a user
 * @param {number} userId - User ID
 * @returns {Object} Session object with id and expires_at
 */
export function createSession(userId) {
  const sessionId = generateSessionId();
  const now = getCurrentTimestamp();
  const expiresAt = now + Math.floor(SESSION_DURATION_MS / 1000);

  run(
    'INSERT INTO sessions (id, user_id, created_at, expires_at, last_activity) VALUES (?, ?, ?, ?, ?)',
    [sessionId, userId, now, expiresAt, now]
  );

  return {
    id: sessionId,
    user_id: userId,
    created_at: now,
    expires_at: expiresAt,
    last_activity: now
  };
}

/**
 * Get session by ID and validate it
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session with user if valid, null otherwise
 */
export function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  const now = getCurrentTimestamp();

  // Get session with user data
  const session = get(
    `SELECT
      s.id, s.user_id, s.created_at, s.expires_at, s.last_activity,
      u.username, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > ?`,
    [sessionId, now]
  );

  if (!session) {
    return null;
  }

  // Update last activity
  run('UPDATE sessions SET last_activity = ? WHERE id = ?', [now, sessionId]);

  return {
    id: session.id,
    user_id: session.user_id,
    created_at: session.created_at,
    expires_at: session.expires_at,
    last_activity: now,
    user: {
      id: session.user_id,
      username: session.username,
      role: session.role
    }
  };
}

/**
 * Delete a session (logout)
 * @param {string} sessionId - Session ID
 * @returns {boolean} True if session was deleted
 */
export function deleteSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  const result = run('DELETE FROM sessions WHERE id = ?', [sessionId]);
  return result.changes > 0;
}

/**
 * Clean up expired sessions
 * @returns {number} Number of sessions deleted
 */
export function cleanupExpiredSessions() {
  const now = getCurrentTimestamp();
  const result = run('DELETE FROM sessions WHERE expires_at <= ?', [now]);
  return result.changes;
}

/**
 * Start automatic session cleanup
 * Runs cleanup every hour
 */
export function startSessionCleanup() {
  // Run initial cleanup
  cleanupExpiredSessions();

  // Set up interval for recurring cleanup
  setInterval(() => {
    const deleted = cleanupExpiredSessions();
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired session(s)`);
    }
  }, SESSION_CLEANUP_INTERVAL_MS);
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Object|null} User object without password
 */
export function getUserById(userId) {
  const user = get(
    'SELECT id, username, role, created_at, last_login FROM users WHERE id = ?',
    [userId]
  );

  return user || null;
}
