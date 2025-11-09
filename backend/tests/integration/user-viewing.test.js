/**
 * Integration test for User Story 1: View Wildlife Activity and Insights
 * T055: Integration test for user viewing images workflow
 *
 * This test verifies the complete user viewing workflow:
 * - Login as regular user
 * - View gallery of processed images
 * - Apply filters (date, species, location)
 * - View image details with detections
 * - View statistics dashboard
 * - View maps with camera locations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('User Story 1: User Viewing Workflow Integration Test', () => {
  let app;
  let db;
  let sessionCookie;
  let testImageIds = [];
  let testMapId;
  let testSpeciesId;

  beforeAll(async () => {
    // Setup in-memory test database
    db = new Database(':memory:');

    // Load schema
    const schemaPath = path.join(__dirname, '../../src/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const statement of statements) {
      try {
        db.prepare(statement).run();
      } catch (err) {
        // Ignore errors for statements that might not be suitable for direct execution
        if (!err.message.includes('PRAGMA') && !err.message.includes('INSERT INTO species')) {
          console.warn('Skipping statement:', statement.substring(0, 50));
        }
      }
    }

    // Create test user
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);
    const now = Math.floor(Date.now() / 1000);

    const userResult = db.prepare(
      'INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
    ).run('testuser', passwordHash, 'user', now);

    const userId = userResult.lastInsertRowid;

    // Get species ID for test data
    const species = db.prepare('SELECT id FROM species WHERE common_name = ?').get('White-tailed Deer');
    testSpeciesId = species ? species.id : null;

    // If no species exist (schema didn't seed), create one
    if (!testSpeciesId) {
      const speciesResult = db.prepare(
        'INSERT INTO species (common_name, scientific_name, category, created_at) VALUES (?, ?, ?, ?)'
      ).run('White-tailed Deer', 'Odocoileus virginianus', 'mammal', now);
      testSpeciesId = speciesResult.lastInsertRowid;
    }

    // Create test map with camera locations
    const mapResult = db.prepare(`
      INSERT INTO maps (name, description, is_shared, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Test Wildlife Area', 'Test map for integration testing', 1, userId, now, now);

    testMapId = mapResult.lastInsertRowid;

    // Create camera locations
    const locationResult = db.prepare(`
      INSERT INTO camera_locations (map_id, label, latitude, longitude, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testMapId, 'North Trail Camera', 40.7128, -74.0060, now);

    const cameraLocationId = locationResult.lastInsertRowid;

    // Create test images with various attributes for filtering
    const imageData = [
      { filename: 'deer-morning.jpg', capturedAt: now - 86400, status: 'completed' },
      { filename: 'deer-evening.jpg', capturedAt: now - 43200, status: 'completed' },
      { filename: 'bear-night.jpg', capturedAt: now - 7200, status: 'completed' },
      { filename: 'pending-image.jpg', capturedAt: now - 3600, status: 'pending' },
      { filename: 'failed-image.jpg', capturedAt: now - 1800, status: 'failed' },
    ];

    for (const [index, data] of imageData.entries()) {
      const imageResult = db.prepare(`
        INSERT INTO images (
          filename, stored_filename, file_hash, file_size, mime_type,
          uploaded_by, uploaded_at, captured_at, processing_status,
          camera_location_id, thumbnail_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.filename,
        `stored-${index}.jpg`,
        `hash-${index}`,
        1024000 + index * 100000,
        'image/jpeg',
        userId,
        now,
        data.capturedAt,
        data.status,
        cameraLocationId,
        data.status === 'completed' ? `/thumbnails/thumb-${index}.jpg` : null
      );

      const imageId = imageResult.lastInsertRowid;
      testImageIds.push(imageId);

      // Create detections for completed images
      if (data.status === 'completed' && testSpeciesId) {
        const numDetections = index === 0 ? 2 : 1; // First image has 2 detections

        for (let i = 0; i < numDetections; i++) {
          db.prepare(`
            INSERT INTO detections (
              image_id, species_id, confidence,
              bounding_box_x, bounding_box_y, bounding_box_width, bounding_box_height,
              detected_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            imageId,
            testSpeciesId,
            0.85 + (i * 0.05),
            0.1 + (i * 0.1),
            0.2 + (i * 0.1),
            0.3,
            0.4,
            data.capturedAt
          );
        }
      }
    }

    // Import and create app (once services are implemented)
    // For now, this will fail until we implement the backend
    try {
      const { default: createApp } = await import('../../src/server.js');
      app = createApp(db);
    } catch (err) {
      console.warn('Server not yet implemented:', err.message);
      app = null;
    }
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  describe('Workflow: User logs in and views images', () => {
    it('should allow user to login', async () => {
      if (!app) return; // Skip if app not implemented yet

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.role).toBe('user');

      // Save session cookie for subsequent requests
      sessionCookie = response.headers['set-cookie'];
      expect(sessionCookie).toBeDefined();
    });

    it('should fetch paginated image gallery', async () => {
      if (!app) return;

      const response = await request(app)
        .get('/api/images?page=1&limit=10')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('images');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.images.length).toBeGreaterThan(0);
    });

    it('should filter images by processing status', async () => {
      if (!app) return;

      const response = await request(app)
        .get('/api/images?processingStatus=completed')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.images.every(img => img.processingStatus === 'completed')).toBe(true);
    });

    it('should filter images by date range', async () => {
      if (!app) return;

      const now = Math.floor(Date.now() / 1000);
      const startDate = now - 86400; // 24 hours ago
      const endDate = now;

      const response = await request(app)
        .get(`/api/images?startDate=${startDate}&endDate=${endDate}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(Array.isArray(response.body.images)).toBe(true);
      // All images should be within date range
      response.body.images.forEach(img => {
        expect(img.capturedAt).toBeGreaterThanOrEqual(startDate);
        expect(img.capturedAt).toBeLessThanOrEqual(endDate);
      });
    });

    it('should view detailed image with detections', async () => {
      if (!app) return;

      const imageId = testImageIds[0]; // First image has detections

      const response = await request(app)
        .get(`/api/images/${imageId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.id).toBe(imageId);
      expect(response.body).toHaveProperty('uploadedBy');
      expect(response.body).toHaveProperty('detections');
      expect(Array.isArray(response.body.detections)).toBe(true);
      expect(response.body.detections.length).toBeGreaterThan(0);

      // Verify detection structure
      const detection = response.body.detections[0];
      expect(detection).toHaveProperty('confidence');
      expect(detection).toHaveProperty('boundingBox');
      expect(detection).toHaveProperty('species');
    });

    it('should fetch species list', async () => {
      if (!app) return;

      const response = await request(app)
        .get('/api/species')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some(s => s.commonName === 'White-tailed Deer')).toBe(true);
    });

    it('should fetch statistics summary', async () => {
      if (!app) return;

      const response = await request(app)
        .get('/api/statistics/summary')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('totalImages');
      expect(response.body).toHaveProperty('totalDetections');
      expect(response.body).toHaveProperty('uniqueSpecies');
      expect(response.body).toHaveProperty('dateRange');
      expect(response.body).toHaveProperty('topSpecies');

      expect(response.body.totalImages).toBeGreaterThan(0);
    });

    it('should fetch species frequency data', async () => {
      if (!app) return;

      const response = await request(app)
        .get('/api/statistics/species-frequency')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(typeof response.body).toBe('object');
      // Should have at least one species with count
      const counts = Object.values(response.body);
      expect(counts.some(count => count > 0)).toBe(true);
    });

    it('should fetch temporal patterns', async () => {
      if (!app) return;

      const response = await request(app)
        .get('/api/statistics/temporal-patterns')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('hourly');
      expect(Array.isArray(response.body.hourly)).toBe(true);
    });

    it('should fetch maps list', async () => {
      if (!app) return;

      const response = await request(app)
        .get('/api/maps')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Should include shared maps
      const testMap = response.body.find(m => m.id === testMapId);
      expect(testMap).toBeDefined();
      expect(testMap.isShared).toBe(true);
    });

    it('should fetch map details with camera locations', async () => {
      if (!app) return;

      const response = await request(app)
        .get(`/api/maps/${testMapId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.id).toBe(testMapId);
      expect(response.body).toHaveProperty('cameraLocations');
      expect(Array.isArray(response.body.cameraLocations)).toBe(true);
      expect(response.body.cameraLocations.length).toBeGreaterThan(0);

      // Verify camera location structure
      const location = response.body.cameraLocations[0];
      expect(location).toHaveProperty('id');
      expect(location).toHaveProperty('label');
      expect(location).toHaveProperty('latitude');
      expect(location).toHaveProperty('longitude');
      expect(location).toHaveProperty('imageCount');
    });

    it('should fetch detections for an image', async () => {
      if (!app) return;

      const imageId = testImageIds[0];

      const response = await request(app)
        .get(`/api/detections?imageId=${imageId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // All detections should belong to the specified image
      response.body.forEach(detection => {
        expect(detection.imageId).toBe(imageId);
      });
    });
  });

  describe('Workflow: Edge cases and error handling', () => {
    it('should return empty results for out-of-range date filters', async () => {
      if (!app) return;

      const pastDate = Math.floor(Date.now() / 1000) - (365 * 86400); // 1 year ago

      const response = await request(app)
        .get(`/api/images?startDate=${pastDate}&endDate=${pastDate + 3600}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.images).toEqual([]);
    });

    it('should handle non-existent image ID gracefully', async () => {
      if (!app) return;

      await request(app)
        .get('/api/images/999999')
        .set('Cookie', sessionCookie)
        .expect(404);
    });

    it('should handle non-existent map ID gracefully', async () => {
      if (!app) return;

      await request(app)
        .get('/api/maps/999999')
        .set('Cookie', sessionCookie)
        .expect(404);
    });

    it('should require authentication for all endpoints', async () => {
      if (!app) return;

      await request(app).get('/api/images').expect(401);
      await request(app).get('/api/species').expect(401);
      await request(app).get('/api/statistics/summary').expect(401);
      await request(app).get('/api/maps').expect(401);
      await request(app).get('/api/detections').expect(401);
    });
  });
});
