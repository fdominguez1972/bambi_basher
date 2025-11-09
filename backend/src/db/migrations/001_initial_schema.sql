-- Migration: 001_initial_schema
-- Description: Initial database schema with all tables and indexes
-- Date: 2025-11-04

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Enable WAL mode for concurrent reads
PRAGMA journal_mode = WAL;

-- Schema migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at INTEGER NOT NULL,
  last_login INTEGER
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_activity INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Processing jobs table
CREATE TABLE processing_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  initiated_by INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_images INTEGER NOT NULL,
  processed_images INTEGER NOT NULL DEFAULT 0,
  successful_images INTEGER NOT NULL DEFAULT 0,
  failed_images INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER,
  completed_at INTEGER,
  error_log TEXT,
  FOREIGN KEY (initiated_by) REFERENCES users(id)
);

CREATE INDEX idx_jobs_initiated_by ON processing_jobs(initiated_by);
CREATE INDEX idx_jobs_status ON processing_jobs(status);
CREATE INDEX idx_jobs_started_at ON processing_jobs(started_at);

-- Maps table
CREATE TABLE maps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  is_shared INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_maps_created_by ON maps(created_by);
CREATE INDEX idx_maps_is_shared ON maps(is_shared);

-- Camera locations table
CREATE TABLE camera_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  map_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE
);

CREATE INDEX idx_camera_locations_map_id ON camera_locations(map_id);
CREATE INDEX idx_camera_locations_coords ON camera_locations(latitude, longitude);

-- Images table
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL UNIQUE,
  file_hash TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL,
  uploaded_at INTEGER NOT NULL,
  captured_at INTEGER,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_job_id INTEGER,
  camera_location_id INTEGER,
  thumbnail_path TEXT,
  error_message TEXT,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (processing_job_id) REFERENCES processing_jobs(id),
  FOREIGN KEY (camera_location_id) REFERENCES camera_locations(id)
);

CREATE INDEX idx_images_uploaded_by ON images(uploaded_by);
CREATE INDEX idx_images_processing_status ON images(processing_status);
CREATE INDEX idx_images_processing_job_id ON images(processing_job_id);
CREATE INDEX idx_images_camera_location_id ON images(camera_location_id);
CREATE INDEX idx_images_captured_at ON images(captured_at);
CREATE INDEX idx_images_file_hash ON images(file_hash);

-- Species table
CREATE TABLE species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  common_name TEXT NOT NULL UNIQUE,
  scientific_name TEXT,
  category TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_species_category ON species(category);

-- Detections table
CREATE TABLE detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id INTEGER NOT NULL,
  species_id INTEGER,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  bounding_box_x REAL NOT NULL,
  bounding_box_y REAL NOT NULL,
  bounding_box_width REAL NOT NULL,
  bounding_box_height REAL NOT NULL,
  detected_at INTEGER NOT NULL,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
  FOREIGN KEY (species_id) REFERENCES species(id)
);

CREATE INDEX idx_detections_image_id ON detections(image_id);
CREATE INDEX idx_detections_species_id ON detections(species_id);
CREATE INDEX idx_detections_confidence ON detections(confidence);

-- Insights table
CREATE TABLE insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('species_frequency', 'temporal_pattern', 'activity_trend')),
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  date_range_start INTEGER,
  date_range_end INTEGER,
  computed_at INTEGER NOT NULL
);

CREATE INDEX idx_insights_metric_type ON insights(metric_type);
CREATE INDEX idx_insights_date_range ON insights(date_range_start, date_range_end);

-- Seed default species
INSERT INTO species (common_name, scientific_name, category, created_at) VALUES
  ('White-tailed Deer', 'Odocoileus virginianus', 'mammal', strftime('%s', 'now')),
  ('Black Bear', 'Ursus americanus', 'mammal', strftime('%s', 'now')),
  ('Coyote', 'Canis latrans', 'mammal', strftime('%s', 'now')),
  ('Raccoon', 'Procyon lotor', 'mammal', strftime('%s', 'now')),
  ('Wild Turkey', 'Meleagris gallopavo', 'bird', strftime('%s', 'now')),
  ('Unknown', NULL, NULL, strftime('%s', 'now'));

-- Record migration
INSERT INTO schema_migrations (version, applied_at) VALUES (1, strftime('%s', 'now'));
