#!/usr/bin/env node

/**
 * Database seed script
 * Populates database with test data for development
 */

import 'dotenv/config';
import { getDatabase } from '../src/db/database.js';
import { hashPassword } from '../src/utils/password.js';

const db = getDatabase();

async function seed() {
  try {
    console.log('=== Database Seed Tool ===\n');

    const now = Math.floor(Date.now() / 1000);

    // Create admin user
    console.log('Creating admin user...');
    const adminHash = await hashPassword('admin123');
    const adminResult = db.prepare(
      'INSERT OR IGNORE INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
    ).run('admin', adminHash, 'admin', now);

    if (adminResult.changes > 0) {
      console.log('✓ Admin user created (username: admin, password: admin123)');
    } else {
      console.log('ℹ Admin user already exists');
    }

    // Create regular user
    console.log('Creating regular user...');
    const userHash = await hashPassword('user123');
    const userResult = db.prepare(
      'INSERT OR IGNORE INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
    ).run('user', userHash, 'user', now);

    if (userResult.changes > 0) {
      console.log('✓ Regular user created (username: user, password: user123)');
    } else {
      console.log('ℹ Regular user already exists');
    }

    // Create a shared map
    console.log('\nCreating test map...');
    const mapResult = db.prepare(
      'INSERT INTO maps (name, description, is_shared, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('Wildlife Reserve', 'Main observation area', 1, 1, now, now);

    console.log('✓ Map created');

    // Create camera locations
    console.log('Creating camera locations...');
    const locations = [
      { label: 'North Trail', lat: 45.5231, lng: -122.6765 },
      { label: 'South Meadow', lat: 45.5156, lng: -122.6789 },
      { label: 'East Ridge', lat: 45.5298, lng: -122.6654 }
    ];

    const locationIds = [];
    locations.forEach(loc => {
      const result = db.prepare(
        'INSERT INTO camera_locations (map_id, label, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(mapResult.lastInsertRowid, loc.label, loc.lat, loc.lng, now);
      locationIds.push(result.lastInsertRowid);
    });

    console.log(`✓ Created ${locations.length} camera locations`);

    // Get species IDs (from migration seed data)
    const species = db.prepare('SELECT id, common_name FROM species').all();
    console.log(`\nFound ${species.length} species in database`);

    // Create test images
    console.log('Creating test images...');
    const imageCount = 15;

    for (let i = 1; i <= imageCount; i++) {
      const capturedAt = now - (i * 3600); // 1 hour apart
      const locationId = locationIds[i % locationIds.length];

      const imageResult = db.prepare(
        `INSERT INTO images (
          filename, stored_filename, file_hash, file_size, mime_type,
          uploaded_by, uploaded_at, captured_at, processing_status,
          camera_location_id, thumbnail_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        `IMG_${String(i).padStart(4, '0')}.jpg`,
        `stored_${i}_${Date.now()}.jpg`,
        `hash_${i}_${Date.now()}`,
        1024 * (100 + Math.floor(Math.random() * 400)), // 100-500KB
        'image/jpeg',
        1,
        now,
        capturedAt,
        'completed',
        locationId,
        `/thumbnails/thumb_${i}.jpg`
      );

      // Create 1-3 detections per image
      const detectionCount = 1 + Math.floor(Math.random() * 3);

      for (let j = 0; j < detectionCount; j++) {
        const randomSpecies = species[Math.floor(Math.random() * species.length)];
        const confidence = 0.7 + (Math.random() * 0.3); // 0.7-1.0

        db.prepare(
          `INSERT INTO detections (
            image_id, species_id, confidence,
            bounding_box_x, bounding_box_y, bounding_box_width, bounding_box_height,
            detected_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          imageResult.lastInsertRowid,
          randomSpecies.id,
          confidence,
          Math.random() * 0.5, // x: 0-0.5
          Math.random() * 0.5, // y: 0-0.5
          0.2 + Math.random() * 0.3, // width: 0.2-0.5
          0.2 + Math.random() * 0.3, // height: 0.2-0.5
          capturedAt
        );
      }
    }

    console.log(`✓ Created ${imageCount} test images with detections`);

    console.log('\n✓ Database seeded successfully!');
    console.log('\nDefault credentials:');
    console.log('  Admin: username=admin, password=admin123');
    console.log('  User:  username=user, password=user123');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();
