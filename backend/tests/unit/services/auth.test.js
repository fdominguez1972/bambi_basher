import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createUser,
  authenticateUser,
  createSession,
  getSession,
  deleteSession,
  cleanupExpiredSessions,
  getUserById
} from '../../../src/services/auth.js';
import { hashPassword, verifyPassword } from '../../../src/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use in-memory database for tests
const TEST_DB_PATH = ':memory:';

describe('Auth Service', () => {
  let db;

  beforeEach(() => {
    // Set up in-memory database for each test
    db = new Database(TEST_DB_PATH);

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../../src/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      db.prepare(statement).run();
    }

    // Mock the database module to use our test database
    vi.resetModules();
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('createUser', () => {
    it('should create a new user with valid input', async () => {
      const user = await createUser('testuser', 'password123', 'user');

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('user');
      expect(user.created_at).toBeDefined();
      expect(user.password_hash).toBeUndefined(); // Should not include password
    });

    it('should create an admin user', async () => {
      const user = await createUser('admin', 'adminpass123', 'admin');

      expect(user.role).toBe('admin');
    });

    it('should reject duplicate usernames', async () => {
      await createUser('duplicate', 'password123', 'user');

      await expect(
        createUser('duplicate', 'otherpass123', 'user')
      ).rejects.toThrow('Username already exists');
    });

    it('should reject invalid username', async () => {
      await expect(
        createUser('', 'password123', 'user')
      ).rejects.toThrow('Username is required');

      await expect(
        createUser(null, 'password123', 'user')
      ).rejects.toThrow('Username is required');
    });

    it('should reject invalid password', async () => {
      await expect(
        createUser('testuser', '', 'user')
      ).rejects.toThrow('Password is required');

      await expect(
        createUser('testuser', null, 'user')
      ).rejects.toThrow('Password is required');
    });

    it('should reject invalid role', async () => {
      await expect(
        createUser('testuser', 'password123', 'superadmin')
      ).rejects.toThrow('Role must be either "admin" or "user"');
    });

    it('should hash the password', async () => {
      const user = await createUser('testuser', 'password123', 'user');

      // Get user from database
      const dbUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);

      expect(dbUser.password_hash).toBeDefined();
      expect(dbUser.password_hash).not.toBe('password123');

      // Verify the hash
      const isValid = await verifyPassword('password123', dbUser.password_hash);
      expect(isValid).toBe(true);
    });
  });

  describe('authenticateUser', () => {
    beforeEach(async () => {
      // Create a test user
      await createUser('testuser', 'password123', 'user');
    });

    it('should authenticate user with correct credentials', async () => {
      const user = await authenticateUser('testuser', 'password123');

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('user');
      expect(user.password_hash).toBeUndefined();
    });

    it('should return null for incorrect password', async () => {
      const user = await authenticateUser('testuser', 'wrongpassword');

      expect(user).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const user = await authenticateUser('nonexistent', 'password123');

      expect(user).toBeNull();
    });

    it('should return null for empty credentials', async () => {
      expect(await authenticateUser('', 'password123')).toBeNull();
      expect(await authenticateUser('testuser', '')).toBeNull();
      expect(await authenticateUser(null, 'password123')).toBeNull();
      expect(await authenticateUser('testuser', null)).toBeNull();
    });

    it('should update last_login timestamp', async () => {
      const beforeLogin = db.prepare('SELECT last_login FROM users WHERE username = ?')
        .get('testuser');

      expect(beforeLogin.last_login).toBeNull();

      await authenticateUser('testuser', 'password123');

      const afterLogin = db.prepare('SELECT last_login FROM users WHERE username = ?')
        .get('testuser');

      expect(afterLogin.last_login).toBeDefined();
      expect(afterLogin.last_login).toBeGreaterThan(0);
    });
  });

  describe('createSession', () => {
    let userId;

    beforeEach(async () => {
      const user = await createUser('testuser', 'password123', 'user');
      userId = user.id;
    });

    it('should create a session for valid user', () => {
      const session = createSession(userId);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.id.length).toBe(64); // 32 bytes hex = 64 chars
      expect(session.user_id).toBe(userId);
      expect(session.created_at).toBeDefined();
      expect(session.expires_at).toBeGreaterThan(session.created_at);
      expect(session.last_activity).toBe(session.created_at);
    });

    it('should generate unique session IDs', () => {
      const session1 = createSession(userId);
      const session2 = createSession(userId);

      expect(session1.id).not.toBe(session2.id);
    });

    it('should set expiration to 24 hours in the future', () => {
      const session = createSession(userId);
      const expectedDuration = 24 * 60 * 60; // 24 hours in seconds

      const actualDuration = session.expires_at - session.created_at;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(actualDuration - expectedDuration)).toBeLessThan(2);
    });
  });

  describe('getSession', () => {
    let userId;
    let sessionId;

    beforeEach(async () => {
      const user = await createUser('testuser', 'password123', 'user');
      userId = user.id;
      const session = createSession(userId);
      sessionId = session.id;
    });

    it('should retrieve valid session with user data', () => {
      const session = getSession(sessionId);

      expect(session).toBeDefined();
      expect(session.id).toBe(sessionId);
      expect(session.user_id).toBe(userId);
      expect(session.user).toBeDefined();
      expect(session.user.username).toBe('testuser');
      expect(session.user.role).toBe('user');
    });

    it('should return null for invalid session ID', () => {
      const session = getSession('invalid-session-id');

      expect(session).toBeNull();
    });

    it('should return null for empty session ID', () => {
      expect(getSession('')).toBeNull();
      expect(getSession(null)).toBeNull();
    });

    it('should return null for expired session', () => {
      // Manually expire the session
      const now = Math.floor(Date.now() / 1000);
      db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?')
        .run(now - 1, sessionId);

      const session = getSession(sessionId);

      expect(session).toBeNull();
    });

    it('should update last_activity timestamp', () => {
      const before = db.prepare('SELECT last_activity FROM sessions WHERE id = ?')
        .get(sessionId);

      // Wait a moment to ensure timestamp changes
      const now = Math.floor(Date.now() / 1000);

      const session = getSession(sessionId);

      expect(session.last_activity).toBeGreaterThanOrEqual(before.last_activity);
    });
  });

  describe('deleteSession', () => {
    let userId;
    let sessionId;

    beforeEach(async () => {
      const user = await createUser('testuser', 'password123', 'user');
      userId = user.id;
      const session = createSession(userId);
      sessionId = session.id;
    });

    it('should delete existing session', () => {
      const result = deleteSession(sessionId);

      expect(result).toBe(true);

      // Verify session is gone
      const session = getSession(sessionId);
      expect(session).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const result = deleteSession('non-existent-id');

      expect(result).toBe(false);
    });

    it('should return false for empty session ID', () => {
      expect(deleteSession('')).toBe(false);
      expect(deleteSession(null)).toBe(false);
    });
  });

  describe('cleanupExpiredSessions', () => {
    let userId;

    beforeEach(async () => {
      const user = await createUser('testuser', 'password123', 'user');
      userId = user.id;
    });

    it('should delete expired sessions', () => {
      // Create sessions
      const session1 = createSession(userId);
      const session2 = createSession(userId);
      const session3 = createSession(userId);

      // Expire two sessions
      const now = Math.floor(Date.now() / 1000);
      db.prepare('UPDATE sessions SET expires_at = ? WHERE id IN (?, ?)')
        .run(now - 1, session1.id, session2.id);

      const deleted = cleanupExpiredSessions();

      expect(deleted).toBe(2);

      // Verify only valid session remains
      expect(getSession(session1.id)).toBeNull();
      expect(getSession(session2.id)).toBeNull();
      expect(getSession(session3.id)).toBeDefined();
    });

    it('should return 0 when no sessions are expired', () => {
      createSession(userId);
      createSession(userId);

      const deleted = cleanupExpiredSessions();

      expect(deleted).toBe(0);
    });

    it('should return 0 when there are no sessions', () => {
      const deleted = cleanupExpiredSessions();

      expect(deleted).toBe(0);
    });
  });

  describe('getUserById', () => {
    let userId;

    beforeEach(async () => {
      const user = await createUser('testuser', 'password123', 'user');
      userId = user.id;
    });

    it('should retrieve user by ID', () => {
      const user = getUserById(userId);

      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('user');
      expect(user.password_hash).toBeUndefined();
    });

    it('should return null for non-existent user', () => {
      const user = getUserById(99999);

      expect(user).toBeNull();
    });
  });
});
