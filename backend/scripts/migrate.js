#!/usr/bin/env node

/**
 * Database migration script
 * Applies all pending migrations to the database
 */

import 'dotenv/config';
import { migrate, getCurrentVersion, isUpToDate } from '../src/db/migrations.js';

try {
  console.log('=== Database Migration Tool ===\n');

  const currentVersion = getCurrentVersion();
  console.log(`Current database version: ${currentVersion}`);

  if (isUpToDate()) {
    console.log('✓ Database is up to date');
    process.exit(0);
  }

  console.log('\nStarting migration...');
  const count = migrate();

  if (count > 0) {
    const newVersion = getCurrentVersion();
    console.log(`\n✓ Database migrated successfully from version ${currentVersion} to ${newVersion}`);
  }

  process.exit(0);
} catch (error) {
  console.error('\n✗ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
