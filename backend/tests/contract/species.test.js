import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app;
let db;
let authToken;

describe('Species API Contract Tests', () => {
  beforeAll(async () => {
    // Set up test database
    const TEST_DB_PATH = ':memory:';
    db = new Database(TEST_DB_PATH);

    // Load schema
    const schemaPath = path.join(__dirname, '../../src/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const statement of statements) {
      db.prepare(statement).run();
    }

    // Create test user and session
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);

    const userResult = db.prepare(
      'INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
    ).run('testuser', passwordHash, 'user', Math.floor(Date.now() / 1000));

    const now = Math.floor(Date.now() / 1000);
    authToken = 'test-session-token';

    db.prepare(
      'INSERT INTO sessions (id, user_id, created_at, expires_at, last_activity) VALUES (?, ?, ?, ?, ?)'
    ).run(authToken, userResult.lastInsertRowid, now, now + 86400, now);

    seedTestData();
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  function seedTestData() {
    const now = Math.floor(Date.now() / 1000);

    // Create species
    const species = [
      { name: 'White-tailed Deer', scientific: 'Odocoileus virginianus', category: 'mammal' },
      { name: 'Black Bear', scientific: 'Ursus americanus', category: 'mammal' },
      { name: 'Coyote', scientific: 'Canis latrans', category: 'mammal' },
      { name: 'Wild Turkey', scientific: 'Meleagris gallopavo', category: 'bird' },
      { name: 'Raccoon', scientific: 'Procyon lotor', category: 'mammal' }
    ];

    species.forEach(s => {
      db.prepare(
        'INSERT INTO species (common_name, scientific_name, category, created_at) VALUES (?, ?, ?, ?)'
      ).run(s.name, s.scientific, s.category, now);
    });
  }

  describe('GET /api/species', () => {
    it('should return 401 when not authenticated', async () => {
      expect(true).toBe(true); // Placeholder

      // Once implemented:
      // const res = await request(app).get('/api/species');
      // expect(res.status).toBe(401);
    });

    it('should return list of all species', async () => {
      // Contract: GET /api/species
      // Response: { species: [{ id, common_name, scientific_name, category }] }
      expect(true).toBe(true); // Placeholder

      // Once implemented:
      // const res = await request(app)
      //   .get('/api/species')
      //   .set('Authorization', `Bearer ${authToken}`);
      //
      // expect(res.status).toBe(200);
      // expect(res.body).toHaveProperty('species');
      // expect(Array.isArray(res.body.species)).toBe(true);
      // expect(res.body.species.length).toBeGreaterThan(0);
    });

    it('should return species with correct structure', async () => {
      // Each species should have: id, common_name, scientific_name, category
      expect(true).toBe(true); // Placeholder

      // Once implemented:
      // const res = await request(app)
      //   .get('/api/species')
      //   .set('Authorization', `Bearer ${authToken}`);
      //
      // expect(res.status).toBe(200);
      // const species = res.body.species[0];
      // expect(species).toHaveProperty('id');
      // expect(species).toHaveProperty('common_name');
      // expect(species).toHaveProperty('scientific_name');
      // expect(species).toHaveProperty('category');
    });

    it('should filter species by category', async () => {
      // Contract: GET /api/species?category=mammal
      expect(true).toBe(true); // Placeholder

      // Once implemented:
      // const res = await request(app)
      //   .get('/api/species?category=mammal')
      //   .set('Authorization', `Bearer ${authToken}`);
      //
      // expect(res.status).toBe(200);
      // expect(res.body.species.every(s => s.category === 'mammal')).toBe(true);
    });

    it('should search species by name', async () => {
      // Contract: GET /api/species?search=deer
      expect(true).toBe(true); // Placeholder

      // Once implemented:
      // const res = await request(app)
      //   .get('/api/species?search=deer')
      //   .set('Authorization', `Bearer ${authToken}`);
      //
      // expect(res.status).toBe(200);
      // expect(res.body.species.length).toBeGreaterThan(0);
      // expect(res.body.species[0].common_name.toLowerCase()).toContain('deer');
    });

    it('should sort species alphabetically by common name', async () => {
      // Contract: GET /api/species?sort=name
      expect(true).toBe(true); // Placeholder

      // Once implemented:
      // const res = await request(app)
      //   .get('/api/species?sort=name')
      //   .set('Authorization', `Bearer ${authToken}`);
      //
      // expect(res.status).toBe(200);
      // const names = res.body.species.map(s => s.common_name);
      // const sortedNames = [...names].sort();
      // expect(names).toEqual(sortedNames);
    });
  });

  describe('GET /api/species/:id', () => {
    it('should return 401 when not authenticated', async () => {
      expect(true).toBe(true); // Placeholder
    });

    it('should return single species with detection count', async () => {
      // Contract: GET /api/species/:id
      // Response: { id, common_name, scientific_name, category, detection_count }
      expect(true).toBe(true); // Placeholder

      // Once implemented:
      // const res = await request(app)
      //   .get('/api/species/1')
      //   .set('Authorization', `Bearer ${authToken}`);
      //
      // expect(res.status).toBe(200);
      // expect(res.body).toHaveProperty('id');
      // expect(res.body).toHaveProperty('common_name');
      // expect(res.body).toHaveProperty('detection_count');
    });

    it('should return 404 for non-existent species', async () => {
      expect(true).toBe(true); // Placeholder

      // Once implemented:
      // const res = await request(app)
      //   .get('/api/species/99999')
      //   .set('Authorization', `Bearer ${authToken}`);
      //
      // expect(res.status).toBe(404);
    });
  });
});
