import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database path from environment or use default
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../storage/database/trailcam.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Enable WAL mode for concurrent reads
db.pragma('journal_mode = WAL');

/**
 * Execute a SQL query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Query result
 */
export function query(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Get a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|undefined} Single row or undefined
 */
export function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * Execute an insert/update/delete query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Result with lastInsertRowid and changes
 */
export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute multiple statements in a transaction
 * @param {Function} fn - Function containing database operations
 * @returns {*} Result of the function
 */
export function transaction(fn) {
  return db.transaction(fn)();
}

/**
 * Close the database connection
 */
export function close() {
  db.close();
}

/**
 * Get the raw database instance for advanced operations
 * @returns {Database} SQLite database instance
 */
export function getDatabase() {
  return db;
}

export default db;
