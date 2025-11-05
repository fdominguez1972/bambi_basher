# Data Model: Trail Camera Image Processing System

**Date**: 2025-11-04
**Feature**: Trail Camera Image Processing System
**Branch**: 001-trail-camera-processing

## Overview

This document defines the data model for the trail camera image processing system. The model is implemented in SQLite with proper normalization, foreign key constraints, and indexes for performance.

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   users     │──────<│   sessions   │       │    images    │
└─────────────┘       └──────────────┘       └──────────────┘
                                                      │
                                                      │ 1:N
                                                      ▼
                                               ┌──────────────┐
                                               │  detections  │
                                               └──────────────┘
                                                      │
                                                      │ N:1
                                                      ▼
                                               ┌──────────────┐
                                               │   species    │
                                               └──────────────┘

┌─────────────┐       ┌──────────────────┐       ┌──────────────┐
│    maps     │──────<│ camera_locations │──────>│    images    │
└─────────────┘       └──────────────────┘       └──────────────┘
                                                          │
                                                          │ N:1
                                                          ▼
                                                   ┌─────────────────┐
                                                   │ processing_jobs │
                                                   └─────────────────┘

┌─────────────┐       ┌──────────────┐
│   images    │──────>│   insights   │
└─────────────┘       └──────────────┘
```

## Entities

### 1. users

Represents system users with role-based access control.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| username | TEXT | NOT NULL, UNIQUE | Login username |
| password_hash | TEXT | NOT NULL | bcrypt hash of password |
| role | TEXT | NOT NULL, CHECK IN ('admin', 'user') | User role (admin or regular user) |
| created_at | INTEGER | NOT NULL | Unix timestamp of account creation |
| last_login | INTEGER | NULL | Unix timestamp of last login |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `username`

**Validation Rules**:
- Username: 3-50 characters, alphanumeric + underscore/hyphen
- Password: Minimum 8 characters, hashed with bcrypt cost factor 12
- Role: Must be either 'admin' or 'user'

**Relationships**:
- 1:N with `sessions` (one user can have multiple active sessions)
- 1:N with `processing_jobs` (admin who initiated the job)

---

### 2. sessions

Represents active user sessions for authentication.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID session identifier |
| user_id | INTEGER | NOT NULL, FOREIGN KEY → users(id) | Associated user |
| created_at | INTEGER | NOT NULL | Unix timestamp of session creation |
| expires_at | INTEGER | NOT NULL | Unix timestamp of session expiration |
| last_activity | INTEGER | NOT NULL | Unix timestamp of last request |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `expires_at` (for cleanup queries)

**Validation Rules**:
- Session ID: UUID v4 format
- Expires after 7 days of creation
- Sliding window: refresh `expires_at` on activity
- Cleanup: Delete expired sessions daily

**Relationships**:
- N:1 with `users` (many sessions belong to one user)

---

### 3. images

Represents uploaded trail camera images with processing metadata.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique image identifier |
| filename | TEXT | NOT NULL | Original uploaded filename |
| stored_filename | TEXT | NOT NULL, UNIQUE | Unique filesystem filename (UUID-based) |
| file_hash | TEXT | NOT NULL, UNIQUE | SHA-256 hash for duplicate detection |
| file_size | INTEGER | NOT NULL | File size in bytes |
| mime_type | TEXT | NOT NULL | MIME type (image/jpeg, image/png, image/tiff) |
| uploaded_by | INTEGER | NOT NULL, FOREIGN KEY → users(id) | User who uploaded the image |
| uploaded_at | INTEGER | NOT NULL | Unix timestamp of upload |
| captured_at | INTEGER | NULL | Unix timestamp from EXIF metadata (if available) |
| processing_status | TEXT | NOT NULL, CHECK IN ('pending', 'processing', 'completed', 'failed') | Current processing state |
| processing_job_id | INTEGER | NULL, FOREIGN KEY → processing_jobs(id) | Associated batch processing job |
| camera_location_id | INTEGER | NULL, FOREIGN KEY → camera_locations(id) | Associated camera location (if assigned) |
| thumbnail_path | TEXT | NULL | Path to generated thumbnail |
| error_message | TEXT | NULL | Error details if processing failed |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `stored_filename`
- UNIQUE INDEX on `file_hash`
- INDEX on `uploaded_by`
- INDEX on `processing_status`
- INDEX on `processing_job_id`
- INDEX on `camera_location_id`
- INDEX on `captured_at` (for date range queries)

**Validation Rules**:
- File size: Maximum 20MB
- MIME type: Must be image/jpeg, image/png, or image/tiff
- Processing status: Valid transitions only (pending→processing→completed/failed)

**Relationships**:
- N:1 with `users` (many images uploaded by one user)
- N:1 with `processing_jobs` (many images in one batch)
- N:1 with `camera_locations` (many images from one camera)
- 1:N with `detections` (one image can have multiple wildlife detections)

---

### 4. detections

Represents wildlife detections within images.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique detection identifier |
| image_id | INTEGER | NOT NULL, FOREIGN KEY → images(id) ON DELETE CASCADE | Associated image |
| species_id | INTEGER | NULL, FOREIGN KEY → species(id) | Detected species (NULL if unknown) |
| confidence | REAL | NOT NULL, CHECK (confidence >= 0 AND confidence <= 1) | Detection confidence score (0.0-1.0) |
| bounding_box_x | REAL | NOT NULL | Bounding box X coordinate (normalized 0-1) |
| bounding_box_y | REAL | NOT NULL | Bounding box Y coordinate (normalized 0-1) |
| bounding_box_width | REAL | NOT NULL | Bounding box width (normalized 0-1) |
| bounding_box_height | REAL | NOT NULL | Bounding box height (normalized 0-1) |
| detected_at | INTEGER | NOT NULL | Unix timestamp of detection (processing time) |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `image_id`
- INDEX on `species_id`
- INDEX on `confidence`

**Validation Rules**:
- Confidence: 0.0 to 1.0 (typically filter detections with confidence < 0.5)
- Bounding box coordinates: Normalized to image dimensions (0-1 range)

**Relationships**:
- N:1 with `images` (many detections in one image; cascade delete)
- N:1 with `species` (many detections of one species)

---

### 5. species

Represents wildlife species catalog for classification.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique species identifier |
| common_name | TEXT | NOT NULL, UNIQUE | Common name (e.g., "White-tailed Deer") |
| scientific_name | TEXT | NULL | Scientific name (e.g., "Odocoileus virginianus") |
| category | TEXT | NULL | Category (mammal, bird, reptile, etc.) |
| created_at | INTEGER | NOT NULL | Unix timestamp of record creation |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `common_name`
- INDEX on `category`

**Validation Rules**:
- Common name: Required, human-readable
- Scientific name: Optional, follows binomial nomenclature

**Relationships**:
- 1:N with `detections` (one species appears in many detections)

**Pre-populated Data**:
Common species should be pre-seeded during database initialization:
- White-tailed Deer
- Black Bear
- Coyote
- Raccoon
- Turkey
- Unknown (catchall for unclassified detections)

---

### 6. processing_jobs

Represents batch processing operations.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique job identifier |
| initiated_by | INTEGER | NOT NULL, FOREIGN KEY → users(id) | Admin user who started the job |
| status | TEXT | NOT NULL, CHECK IN ('pending', 'running', 'completed', 'failed') | Job status |
| total_images | INTEGER | NOT NULL | Total images in batch |
| processed_images | INTEGER | NOT NULL, DEFAULT 0 | Images processed so far |
| successful_images | INTEGER | NOT NULL, DEFAULT 0 | Successfully processed images |
| failed_images | INTEGER | NOT NULL, DEFAULT 0 | Failed images |
| started_at | INTEGER | NULL | Unix timestamp when processing started |
| completed_at | INTEGER | NULL | Unix timestamp when processing completed |
| error_log | TEXT | NULL | Error messages and logs |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `initiated_by`
- INDEX on `status`
- INDEX on `started_at`

**Validation Rules**:
- Total images = processed + pending
- processed_images = successful_images + failed_images
- Status transitions: pending→running→completed/failed

**Relationships**:
- N:1 with `users` (many jobs initiated by one admin)
- 1:N with `images` (one job processes many images)

---

### 7. maps

Represents geographical maps with camera locations.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique map identifier |
| name | TEXT | NOT NULL | Map display name |
| description | TEXT | NULL | Optional description |
| is_shared | INTEGER | NOT NULL, DEFAULT 0 | Boolean: 1 if shared with all users, 0 if private |
| created_by | INTEGER | NOT NULL, FOREIGN KEY → users(id) | Admin who created the map |
| created_at | INTEGER | NOT NULL | Unix timestamp of creation |
| updated_at | INTEGER | NOT NULL | Unix timestamp of last update |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `created_by`
- INDEX on `is_shared`

**Validation Rules**:
- Name: Required, 3-100 characters
- is_shared: 0 (false) or 1 (true)

**Relationships**:
- N:1 with `users` (many maps created by one admin)
- 1:N with `camera_locations` (one map contains many camera locations)

---

### 8. camera_locations

Represents camera positions on maps.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique location identifier |
| map_id | INTEGER | NOT NULL, FOREIGN KEY → maps(id) ON DELETE CASCADE | Associated map |
| label | TEXT | NOT NULL | Location label (e.g., "North Trail Cam 1") |
| latitude | REAL | NOT NULL, CHECK (latitude >= -90 AND latitude <= 90) | GPS latitude |
| longitude | REAL | NOT NULL, CHECK (longitude >= -180 AND longitude <= 180) | GPS longitude |
| created_at | INTEGER | NOT NULL | Unix timestamp of creation |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `map_id`
- INDEX on `(latitude, longitude)` (for spatial queries)

**Validation Rules**:
- Latitude: -90 to 90 degrees
- Longitude: -180 to 180 degrees
- Label: Required, descriptive name

**Relationships**:
- N:1 with `maps` (many locations on one map; cascade delete)
- 1:N with `images` (one camera location associated with many images)

---

### 9. insights

Represents pre-computed analytics and statistics.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique insight identifier |
| metric_type | TEXT | NOT NULL, CHECK IN ('species_frequency', 'temporal_pattern', 'activity_trend') | Type of insight |
| metric_name | TEXT | NOT NULL | Human-readable metric name |
| metric_value | TEXT | NOT NULL | JSON-encoded metric data |
| date_range_start | INTEGER | NULL | Unix timestamp of data range start |
| date_range_end | INTEGER | NULL | Unix timestamp of data range end |
| computed_at | INTEGER | NOT NULL | Unix timestamp of computation |

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `metric_type`
- INDEX on `(date_range_start, date_range_end)`

**Validation Rules**:
- metric_value: Valid JSON string
- metric_type: One of predefined types

**Example Metrics**:
- **species_frequency**: `{"deer": 150, "bear": 12, "coyote": 45}`
- **temporal_pattern**: `{"00-06": 5, "06-12": 120, "12-18": 200, "18-24": 50}` (detections by time of day)
- **activity_trend**: `{"2025-01": 300, "2025-02": 450, "2025-03": 380}` (detections by month)

**Relationships**:
- Standalone entity (aggregates data from images and detections)
- Regenerated periodically or on-demand

---

## SQLite Schema (DDL)

```sql
-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Enable WAL mode for concurrent reads
PRAGMA journal_mode = WAL;

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
```

---

## Data Integrity Rules

1. **Foreign Key Constraints**: Enabled globally; all relationships enforced
2. **Cascade Deletes**:
   - Deleting a user cascades to sessions (logout all sessions)
   - Deleting an image cascades to detections (remove all detection data)
   - Deleting a map cascades to camera_locations (remove all markers)
3. **Check Constraints**:
   - Role values limited to 'admin' or 'user'
   - Processing status transitions validated
   - Confidence scores bounded to 0-1
   - GPS coordinates within valid ranges
4. **Unique Constraints**:
   - Usernames unique across all users
   - Image file hashes prevent duplicate uploads
   - Stored filenames prevent filesystem collisions

---

## Performance Optimizations

1. **Indexes**: All foreign keys and frequently queried columns indexed
2. **WAL Mode**: Write-Ahead Logging enabled for concurrent read performance
3. **Prepared Statements**: Use parameterized queries to benefit from query plan caching
4. **Batch Inserts**: Insert multiple detections in a single transaction
5. **Denormalization**: Insights table pre-computes statistics to avoid heavy aggregations

---

## Migration Strategy

1. Initial schema applied via `001_initial_schema.sql`
2. Future migrations numbered sequentially: `002_add_feature_x.sql`
3. Migration tracking table:

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);
```

4. Apply migrations on server startup; skip already applied versions

---

## Next Steps

- Generate API contracts (OpenAPI spec) based on this data model
- Create quickstart.md with setup instructions
- Define contract tests for data validation
