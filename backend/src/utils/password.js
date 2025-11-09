import bcrypt from 'bcrypt';

// Salt rounds for bcrypt (10 is a good balance of security and performance)
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password to compare against
 * @returns {Promise<boolean>} True if password matches hash
 */
export async function verifyPassword(password, hash) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  if (!hash || typeof hash !== 'string') {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Invalid hash format or comparison error
    return false;
  }
}
