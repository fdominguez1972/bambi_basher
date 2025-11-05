# Research: Trail Camera Image Processing System

**Date**: 2025-11-04
**Feature**: Trail Camera Image Processing System
**Branch**: 001-trail-camera-processing

## Overview

This document captures research findings and technical decisions for implementing a multi-user trail camera image processing application. The research focuses on minimal-dependency architecture using Vite, vanilla JavaScript, SQLite, and Docker-based image processing with optional hardware acceleration.

## 1. Frontend Architecture: Vite + Vanilla JavaScript

### Decision

Use **Vite** as the build tool with **vanilla HTML, CSS, and JavaScript** (no frameworks like React/Vue/Svelte).

### Rationale

1. **Minimal Dependencies**: User explicitly requested minimal libraries; vanilla JS eliminates framework overhead
2. **Performance**: No virtual DOM or runtime framework code results in smaller bundle sizes and faster initial load
3. **Learning Curve**: Vanilla JS is universally understood, reducing onboarding time
4. **Vite Benefits**:
   - Lightning-fast hot module replacement (HMR) during development
   - Optimized production builds with tree-shaking and code splitting
   - Native ES modules support for modern browsers
   - Built-in TypeScript support (optional for gradual typing)

### Alternatives Considered

- **React/Vue/Svelte**: Rejected due to additional dependencies and framework learning curve; violates minimal-dependency requirement
- **Webpack/Parcel**: Vite chosen for superior developer experience, faster builds, and better ES module support
- **No build tool**: Rejected because modern features (CSS preprocessing, code splitting, optimization) require tooling

### Best Practices

- **Component Organization**: Create reusable vanilla JS components as ES6 modules (export functions that return DOM elements)
- **State Management**: Use custom event system (`CustomEvent` + `addEventListener`) for component communication
- **Templating**: Use template literals for HTML generation; consider `<template>` tags for reusable markup
- **Routing**: Implement client-side routing with `History API` (`pushState`, `popstate` event)
- **CSS Modules**: Leverage CSS custom properties (variables) for design system consistency
- **Build Optimization**: Configure Vite code splitting by page to reduce initial bundle size

### References

- [Vite Documentation](https://vitejs.dev/)
- [Vanilla JS Patterns](https://www.patterns.dev/posts/vanilla-js/)
- [Modern Vanilla JS Components](https://gomakethings.com/guides/)

---

## 2. Backend: Node.js with Express

### Decision

Use **Node.js v20 LTS** with **Express.js** for the HTTP server and API layer.

### Rationale

1. **Minimal Dependencies**: Express is a lightweight, unopinionated framework requiring few dependencies
2. **JavaScript Ecosystem**: Sharing language between frontend and backend simplifies development
3. **Docker SDK**: Official Docker SDK for Node.js enables container orchestration from JavaScript
4. **SQLite Integration**: `better-sqlite3` provides synchronous, high-performance SQLite access for Node.js
5. **Maturity**: Express is battle-tested, well-documented, and widely used

### Alternatives Considered

- **Fastify**: Rejected; while faster, Express has broader ecosystem and better Docker SDK examples
- **Python (FastAPI)**: Rejected; would require managing two language ecosystems (JS frontend + Python backend)
- **Deno/Bun**: Rejected; less mature, fewer production examples, potential compatibility issues with Docker SDK

### Best Practices

- **Middleware Stack**: Authentication → Logging → Validation → Error Handling
- **Error Handling**: Centralized error middleware with custom error classes (`AuthError`, `ValidationError`, etc.)
- **Async/Await**: Use async route handlers with try/catch; avoid callback hell
- **Security**: Helmet.js for HTTP headers, rate limiting, input sanitization
- **Logging**: Structured JSON logging (Winston or Pino) for production monitoring
- **Environment Config**: Use `dotenv` for environment variables; validate on startup

### References

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Production Checklist](https://github.com/goldbergyoni/nodebestpractices)

---

## 3. Database: SQLite with better-sqlite3

### Decision

Use **SQLite** for data persistence with **better-sqlite3** Node.js driver.

### Rationale

1. **User Requirement**: Explicitly specified SQLite
2. **Zero Configuration**: No separate database server; embedded database simplifies deployment
3. **Performance**: Synchronous API (better-sqlite3) eliminates async overhead for simple queries
4. **Scale Fit**: Suitable for 50 concurrent users and 50k+ images; SQLite handles this workload well
5. **ACID Compliance**: Full transaction support for data integrity
6. **File-Based**: Easy backups (copy database file), portable across environments

### Alternatives Considered

- **PostgreSQL/MySQL**: Rejected; overkill for scale requirements, requires separate server management
- **node-sqlite3 (async)**: Rejected; better-sqlite3 offers superior performance with synchronous API for Node.js

### Best Practices

- **Schema Design**: Use foreign keys with `PRAGMA foreign_keys = ON` for referential integrity
- **Indexes**: Create indexes on frequently queried columns (user_id, image_id, species, timestamp, processing_status)
- **Transactions**: Wrap multi-statement operations in transactions for atomicity
- **Migrations**: Version-controlled SQL migration scripts (numbered: 001_initial_schema.sql, 002_add_maps.sql)
- **WAL Mode**: Enable Write-Ahead Logging (`PRAGMA journal_mode=WAL`) for concurrent reads during writes
- **Query Optimization**:
  - Use `EXPLAIN QUERY PLAN` to verify index usage
  - Avoid SELECT *; specify columns explicitly
  - Use prepared statements to prevent SQL injection and improve performance
- **Backup Strategy**: Scheduled backups using `.backup` command or filesystem snapshots

### Performance Considerations

- **Connection Pooling**: Not needed (single database file, synchronous access)
- **Caching**: Pre-compute statistics (species counts, activity patterns) and store in database
- **Pagination**: Use `LIMIT` and `OFFSET` for large result sets (image galleries)
- **Full-Text Search**: Consider SQLite FTS5 extension for image metadata search if needed

### References

- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Performance Tuning](https://www.sqlite.org/optoverview.html)
- [SQLite Best Practices](https://www.sqlite.org/draft/bestindex.html)

---

## 4. Image Processing: Docker + Python (PyTorch/OpenCV)

### Decision

Use **Docker containers** running **Python** with **PyTorch** (or TensorFlow) and **OpenCV** for wildlife detection and species identification, with **optional GPU acceleration**.

### Rationale

1. **User Requirement**: Explicitly specified Docker containers with optional hardware acceleration
2. **Isolation**: Docker isolates processing workloads from web server; failures don't crash main application
3. **GPU Support**: Docker enables NVIDIA GPU access via `--gpus` flag with minimal host configuration
4. **Python Ecosystem**: PyTorch/TensorFlow have mature wildlife detection models (YOLO, Faster R-CNN, MegaDetector)
5. **Pre-trained Models**: Microsoft MegaDetector is purpose-built for camera trap wildlife detection
6. **Reproducibility**: Docker image ensures consistent processing environment across development/production

### Alternatives Considered

- **Node.js ML Libraries (TensorFlow.js)**: Rejected; limited wildlife detection models, slower inference than Python
- **Cloud APIs (AWS Rekognition, Google Vision)**: Rejected; adds external dependency, recurring costs, network latency
- **Direct Python Process**: Rejected; lacks isolation, harder to manage resources, no easy GPU access

### Best Practices

**Model Selection**:
- **MegaDetector v5** (Microsoft): Pre-trained on 4.9M camera trap images, detects animals/people/vehicles
- **YOLOv8**: Fast, accurate object detection with custom wildlife species training
- **ResNet/EfficientNet**: Species classification after detection

**Docker Architecture**:
```dockerfile
FROM python:3.11-slim
# For GPU: FROM nvidia/cuda:12.0-cudnn8-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \  # OpenCV dependencies
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY process.py models/ ./
CMD ["python", "process.py"]
```

**Processing Pipeline**:
1. Node.js backend receives upload, stores images, inserts records with `processing_status='pending'`
2. Backend spawns Docker container with volume mounts: `-v ./storage/images:/input -v ./storage/thumbnails:/output`
3. Python script:
   - Load pre-trained model (MegaDetector)
   - Iterate images in `/input`
   - Perform detection (bounding boxes, confidence scores)
   - Classify species if detected
   - Generate thumbnails (OpenCV resize)
   - Output JSON results to stdout
4. Node.js captures stdout, parses JSON, updates database with detections
5. Container exits; Node.js marks job `completed` or `failed`

**Hardware Acceleration**:
- **CPU**: Default mode, works everywhere
- **GPU**: Pass `--gpus all` flag when spawning container; requires NVIDIA Docker runtime installed on host
- **Detection**: Check for GPU availability in Python (`torch.cuda.is_available()`), fall back to CPU gracefully

**Batch Processing Strategy**:
- Process images in batches (100-500 at a time) to amortize model loading overhead
- Use queue system (in-memory array or Redis if scaling further) to manage job order
- Prevent concurrent processing jobs to avoid resource contention (single Docker container at a time initially)

**Error Handling**:
- Container timeout (kill after 30 minutes for hung processes)
- Invalid image handling (log error, mark image as `failed`, continue batch)
- Model loading failures (retry with exponential backoff, alert admin)
- OOM errors (reduce batch size, log warning)

### References

- [Microsoft MegaDetector](https://github.com/microsoft/CameraTraps)
- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [Docker GPU Support](https://docs.docker.com/config/containers/resource_constraints/#gpu)
- [PyTorch Docker Images](https://hub.docker.com/r/pytorch/pytorch)

---

## 5. Testing Strategy: Vitest

### Decision

Use **Vitest** for unit and integration testing.

### Rationale

1. **Vite Ecosystem**: Native Vitest integration with Vite for zero-config testing
2. **Jest-Compatible API**: Familiar syntax for developers with Jest experience
3. **Fast Execution**: Powered by Vite's transformation pipeline, faster than Jest
4. **ES Modules**: Native support for ESM, aligns with modern JavaScript
5. **Coverage**: Built-in coverage reporting with c8/Istanbul

### Alternatives Considered

- **Jest**: Rejected; slower, requires additional configuration for ESM, not Vite-native
- **Mocha/Chai**: Rejected; requires more boilerplate, less integrated with Vite

### Best Practices

**Test Organization**:
```
tests/
├── unit/
│   ├── backend/
│   │   ├── services/          # Service layer tests
│   │   └── utils/             # Utility function tests
│   └── frontend/
│       ├── components/        # Component logic tests
│       └── utils/             # Frontend utility tests
├── integration/
│   ├── api/                   # API endpoint tests (supertest)
│   ├── database/              # Database query tests
│   └── processing/            # Docker processing workflow tests
└── contract/
    └── api-contracts.test.js  # OpenAPI schema validation
```

**Unit Tests**:
- Test individual functions in isolation
- Mock external dependencies (database, Docker SDK)
- Target: 80%+ code coverage per constitution

**Integration Tests**:
- Test API endpoints with real database (use in-memory SQLite for speed)
- Test Docker processing with sample images
- Verify end-to-end workflows (upload → process → retrieve results)

**Contract Tests**:
- Validate API responses against OpenAPI schema
- Ensure frontend and backend agree on data structures
- Use `ajv` or `openapi-schema-validator` for validation

**TDD Workflow** (per constitution):
1. Write failing test
2. Implement minimal code to pass
3. Refactor
4. Commit

**Mocking**:
- Use Vitest's built-in `vi.mock()` for module mocking
- Mock Docker SDK for unit tests (avoid spawning real containers)
- Mock file system operations with `memfs` for upload tests

### References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

## 6. Authentication & Session Management

### Decision

Use **session-based authentication** with **HTTP-only cookies** for session tokens.

### Rationale

1. **Security**: HTTP-only cookies prevent XSS attacks from stealing tokens
2. **Simplicity**: No need for JWT refresh token complexity; server-side sessions are straightforward
3. **Revocation**: Easy to invalidate sessions server-side (logout, suspicious activity)
4. **Scale Fit**: 50 concurrent users don't require stateless JWT architecture

### Alternatives Considered

- **JWT (Stateless)**: Rejected; adds complexity (refresh tokens, key management), harder to revoke
- **OAuth 2.0**: Rejected; overkill for internal user management (no third-party authentication needed)
- **Basic Auth**: Rejected; insecure without HTTPS for every request, no session persistence

### Implementation Details

**Session Storage**: SQLite table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Authentication Flow**:
1. User submits login form (username + password)
2. Backend validates credentials, hashes password with bcrypt
3. Generate session ID (crypto.randomUUID()), store in `sessions` table
4. Set HTTP-only cookie: `Set-Cookie: session_id=<ID>; HttpOnly; Secure; SameSite=Strict`
5. Subsequent requests include cookie; middleware validates session, attaches `req.user`

**Password Hashing**: bcrypt with cost factor 12 (balance security and performance)

**Session Expiration**: 7-day expiration, refresh on activity (sliding window)

### Best Practices

- **HTTPS Only**: Set `Secure` flag on cookies (requires HTTPS in production)
- **CSRF Protection**: Use SameSite=Strict and CSRF tokens for state-changing requests
- **Rate Limiting**: Limit login attempts (5 attempts per 15 minutes per IP)
- **Password Policy**: Minimum 8 characters, enforce complexity if needed
- **Session Cleanup**: Periodic cleanup of expired sessions (daily cron job)

### References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Session Management Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## 7. Map Integration: Leaflet.js

### Decision

Use **Leaflet.js** for interactive maps with **OpenStreetMap** tiles.

### Rationale

1. **Lightweight**: ~40KB gzipped, minimal dependency aligning with project goals
2. **No API Keys**: OpenStreetMap tiles are free (unlike Google Maps)
3. **Customizable**: Full control over markers, popups, and interactions
4. **Mobile-Friendly**: Touch-optimized, responsive
5. **Widely Adopted**: Extensive documentation, plugins, community support

### Alternatives Considered

- **Google Maps**: Rejected; requires API key, billing setup, vendor lock-in
- **Mapbox**: Rejected; requires account and API token (free tier limited)
- **OpenLayers**: Rejected; more complex, heavier library (better for GIS applications)

### Implementation Details

**Dependency**: Single script include (Leaflet CSS + JS)
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

**Map Creation**:
```javascript
const map = L.map('map-container').setView([defaultLat, defaultLng], zoomLevel);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

**Camera Location Markers**:
```javascript
const marker = L.marker([lat, lng], {
  icon: customCameraIcon
}).addTo(map);
marker.bindPopup(`<b>${cameraName}</b><br>${imageCount} images`);
marker.on('click', () => loadCameraImages(cameraId));
```

**Admin Map Editor**:
- Enable click-to-add markers in edit mode
- Draggable markers for repositioning
- Form to input camera name and link to images

### Best Practices

- **Lazy Load**: Load Leaflet only on map pages (not global)
- **Marker Clustering**: Use Leaflet.markercluster plugin if >50 cameras
- **Custom Icons**: SVG icons for camera markers (accessible, scalable)
- **Accessibility**: Provide text alternative for map (list view of cameras)
- **Performance**: Limit initial marker load; fetch markers in viewport bounds for large deployments

### References

- [Leaflet Documentation](https://leafletjs.com/)
- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)

---

## 8. File Upload Handling

### Decision

Use **Multer** middleware for multipart/form-data file uploads with **disk storage**.

### Rationale

1. **Express Integration**: De facto standard for Express file uploads
2. **Streaming**: Memory-efficient streaming to disk (important for large images)
3. **Validation**: Built-in file size and type filtering
4. **Simplicity**: Minimal configuration, well-documented

### Alternatives Considered

- **Formidable**: Rejected; more complex API, less Express-centric
- **Busboy**: Rejected; lower-level, more boilerplate required

### Implementation Details

**Configuration**:
```javascript
const multer = require('multer');
const storage = multer.diskStorage({
  destination: './storage/images/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

**Upload Endpoint**:
```javascript
app.post('/api/images/upload', requireAdmin, upload.array('images', 500), async (req, res) => {
  // req.files contains uploaded files
  // Insert metadata into database
  // Return upload summary
});
```

**Duplicate Detection**:
- Compute SHA-256 hash of file contents
- Check database for existing hash before saving
- Reject duplicates or link to existing record

### Best Practices

- **Virus Scanning**: Integrate ClamAV or similar for uploaded file scanning (optional, add if security critical)
- **File Validation**: Verify actual file type (magic bytes) beyond MIME type
- **Temporary Storage**: Save to temp directory first, move to permanent storage after validation
- **Cleanup**: Delete files if database insert fails (transaction-like behavior)
- **Progress Tracking**: Use chunked uploads or WebSockets for real-time progress (future enhancement)

### References

- [Multer Documentation](https://github.com/expressjs/multer)
- [File Upload Security](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

---

## 9. Frontend State Management

### Decision

Use **custom event-driven architecture** with **localStorage** for persistence.

### Rationale

1. **Vanilla JS Alignment**: No framework means no Redux/Vuex; custom solution fits
2. **Simplicity**: Event bus pattern is straightforward and sufficient for scale
3. **Browser Native**: CustomEvent API is built-in, zero dependencies

### Implementation Details

**Event Bus**:
```javascript
// services/event-bus.js
class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

export const eventBus = new EventBus();
```

**State Management Pattern**:
- **Auth State**: Store user role and session in `auth-service.js`, emit `auth:changed` events
- **Filter State**: Store active filters (date range, species) in component, emit `filters:updated`
- **Persistence**: Save user preferences (theme, view mode) to localStorage

**Component Communication**:
```javascript
// Component A emits
eventBus.emit('images:filtered', { species: 'deer', dateRange });

// Component B listens
eventBus.on('images:filtered', (filters) => {
  updateGallery(filters);
});
```

### Best Practices

- **Namespace Events**: Use `module:action` naming (e.g., `auth:login`, `images:loaded`)
- **Cleanup Listeners**: Remove listeners when components unmount to prevent memory leaks
- **Immutable Data**: Don't mutate event data; create new objects
- **Debounce**: Debounce high-frequency events (scroll, input) to avoid performance issues

### References

- [Observer Pattern in JavaScript](https://www.patterns.dev/posts/observer-pattern/)
- [CustomEvent API](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)

---

## 10. Accessibility (WCAG 2.1 Level AA)

### Decision

Implement **WCAG 2.1 Level AA compliance** as required by the constitution.

### Key Requirements

1. **Keyboard Navigation**: All interactive elements accessible via Tab, Enter, Space, Arrow keys
2. **Screen Reader Support**: Semantic HTML (`<nav>`, `<main>`, `<article>`), ARIA labels where needed
3. **Color Contrast**: 4.5:1 for normal text, 3:1 for large text (use contrast checker)
4. **Focus Indicators**: Visible focus outlines on all interactive elements
5. **Alt Text**: Descriptive alt text for all images (critical for wildlife photos)
6. **Form Labels**: Every input has associated `<label>` or `aria-label`
7. **Error Identification**: Clear error messages, linked to form fields via `aria-describedby`
8. **Responsive Text**: Support text zoom up to 200% without layout breaking

### Implementation Checklist

- [ ] Use semantic HTML5 elements
- [ ] Provide skip-to-content link
- [ ] Ensure interactive elements have visible focus states
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test keyboard-only navigation
- [ ] Run automated accessibility audit (axe DevTools, Lighthouse)
- [ ] Provide text alternatives for all non-text content
- [ ] Ensure form validation errors are announced to screen readers

### Tools

- **axe DevTools**: Browser extension for automated testing
- **Lighthouse**: Built into Chrome DevTools
- **WAVE**: Web accessibility evaluation tool
- **Screen Readers**: NVDA (Windows, free), VoiceOver (macOS, built-in)

### References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## Summary of Decisions

| **Area** | **Technology** | **Justification** |
|----------|---------------|-------------------|
| Build Tool | Vite | Fast HMR, optimized builds, ES modules |
| Frontend | Vanilla JS + HTML/CSS | Minimal dependencies, full control, lightweight |
| Backend | Node.js v20 + Express | JavaScript ecosystem, Docker SDK, SQLite integration |
| Database | SQLite + better-sqlite3 | Embedded, zero-config, performant, user requirement |
| Image Processing | Docker + Python (PyTorch/OpenCV) | Isolation, GPU support, pre-trained wildlife models |
| Testing | Vitest | Vite-native, fast, Jest-compatible API |
| Authentication | Session-based (HTTP-only cookies) | Secure, simple, revocable |
| Maps | Leaflet.js + OpenStreetMap | Lightweight, no API keys, customizable |
| File Upload | Multer | Express-standard, streaming, validation |
| State Management | Custom Event Bus + localStorage | Vanilla JS fit, simple, sufficient |
| Accessibility | WCAG 2.1 Level AA | Constitution requirement, inclusive design |

---

## Next Steps

1. **Phase 1**: Generate data-model.md (entity schemas based on spec.md)
2. **Phase 1**: Generate API contracts (OpenAPI spec in contracts/)
3. **Phase 1**: Generate quickstart.md (setup and development guide)
4. **Phase 1**: Update agent context with technology stack
5. **Phase 2**: Generate tasks.md (implementation task breakdown)
