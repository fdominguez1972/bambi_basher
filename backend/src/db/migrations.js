import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Get all migration files sorted by version
 * @returns {Array<{version: number, filename: string, path: string}>}
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const match = file.match(/^(\d+)_/);
      if (!match) {
        throw new Error(`Invalid migration filename: ${file}. Must start with version number (e.g., 001_name.sql)`);
      }
      return {
        version: parseInt(match[1], 10),
        filename: file,
        path: path.join(MIGRATIONS_DIR, file)
      };
    })
    .sort((a, b) => a.version - b.version);

  return files;
}

/**
 * Get applied migration versions from database
 * @returns {Set<number>}
 */
function getAppliedMigrations() {
  const db = getDatabase();

  // Check if schema_migrations table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='schema_migrations'
  `).get();

  if (!tableExists) {
    return new Set();
  }

  const rows = db.prepare('SELECT version FROM schema_migrations').all();
  return new Set(rows.map(row => row.version));
}

/**
 * Apply a single migration
 * @param {Object} migration - Migration object
 */
function applyMigration(migration) {
  const db = getDatabase();
  const sql = fs.readFileSync(migration.path, 'utf8');

  console.log(`Applying migration ${migration.version}: ${migration.filename}`);

  try {
    // Execute migration in a transaction
    db.transaction(() => {
      // Split SQL into individual statements (simple approach)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        // Skip if it's a PRAGMA or INSERT into schema_migrations (will be done below)
        if (statement.startsWith('PRAGMA') || statement.includes('schema_migrations')) {
          if (!statement.includes('CREATE TABLE') && !statement.includes('schema_migrations')) {
            continue;
          }
        }
        db.prepare(statement).run();
      }
    })();

    console.log(`✓ Migration ${migration.version} applied successfully`);
  } catch (error) {
    console.error(`✗ Failed to apply migration ${migration.version}:`, error.message);
    throw error;
  }
}

/**
 * Run all pending migrations
 * @returns {number} Number of migrations applied
 */
export function migrate() {
  const db = getDatabase();
  const migrations = getMigrationFiles();
  const applied = getAppliedMigrations();

  const pending = migrations.filter(m => !applied.has(m.version));

  if (pending.length === 0) {
    console.log('No pending migrations');
    return 0;
  }

  console.log(`Found ${pending.length} pending migration(s)`);

  for (const migration of pending) {
    applyMigration(migration);
  }

  console.log(`✓ Applied ${pending.length} migration(s)`);
  return pending.length;
}

/**
 * Get current database version (highest applied migration)
 * @returns {number} Current version (0 if no migrations applied)
 */
export function getCurrentVersion() {
  const applied = getAppliedMigrations();
  return applied.size > 0 ? Math.max(...applied) : 0;
}

/**
 * Check if database is up to date
 * @returns {boolean}
 */
export function isUpToDate() {
  const migrations = getMigrationFiles();
  const applied = getAppliedMigrations();

  if (migrations.length === 0) return true;

  const latestVersion = Math.max(...migrations.map(m => m.version));
  return applied.has(latestVersion);
}
