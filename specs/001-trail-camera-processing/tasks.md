# Tasks: Trail Camera Image Processing System

**Input**: Design documents from `/specs/001-trail-camera-processing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL per TDD constitution requirement. This implementation follows TDD - tests are written BEFORE implementation for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below use web app structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create root package.json with workspace configuration for backend and frontend
- [ ] T002 Create backend/package.json with Node.js v20, Express, better-sqlite3, dockerode dependencies
- [ ] T003 Create frontend/package.json with Vite, Leaflet.js dependencies
- [ ] T004 [P] Configure ESLint in backend/.eslintrc.json with max complexity 10
- [ ] T005 [P] Configure Prettier in backend/.prettierrc.json
- [ ] T006 [P] Configure ESLint in frontend/.eslintrc.json
- [ ] T007 [P] Configure Prettier in frontend/.prettierrc.json
- [ ] T008 [P] Configure Vitest in backend/vitest.config.js for unit and integration tests
- [ ] T009 [P] Configure Vitest in frontend/vitest.config.js
- [ ] T010 [P] Configure Vite in frontend/vite.config.js with proxy to backend
- [ ] T011 Create backend/.env.example with all required environment variables
- [ ] T012 Create .gitignore for backend/storage/, backend/.env, node_modules
- [ ] T013 Create backend/storage/ directories: images/, thumbnails/, database/
- [ ] T014 Create README.md with quickstart instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [ ] T015 Create backend/src/db/schema.sql with complete SQLite schema from data-model.md
- [ ] T016 Create backend/src/db/migrations/001_initial_schema.sql with schema and seed data
- [ ] T017 Create backend/src/db/database.js with better-sqlite3 connection, WAL mode, foreign keys enabled
- [ ] T018 Create backend/src/db/migrations.js to run migration files and track versions

### Authentication & Authorization Foundation

- [ ] T019 Create backend/src/utils/errors.js with custom error classes (AuthError, ValidationError, NotFoundError)
- [ ] T020 Create backend/src/services/auth.js with login, logout, session validation, bcrypt password hashing
- [ ] T021 Create backend/src/api/middleware.js with requireAuth, requireAdmin, error handling middleware
- [ ] T022 Create backend/tests/unit/services/auth.test.js testing login, logout, session management

### API Foundation

- [ ] T023 Create backend/src/utils/logger.js with structured JSON logging (Winston/Pino)
- [ ] T024 Create backend/src/server.js with Express app, CORS, JSON middleware, error handlers
- [ ] T025 Create backend/src/api/routes.js with route registration structure
- [ ] T026 Create backend/src/api/validators.js with request validation helpers

### Frontend Foundation

- [ ] T027 Create frontend/public/index.html with meta tags, accessibility attributes
- [ ] T028 Create frontend/src/styles/variables.css with CSS custom properties (design system colors, spacing, fonts)
- [ ] T029 [P] Create frontend/src/styles/reset.css with CSS reset
- [ ] T030 [P] Create frontend/src/styles/global.css with global typography and layout
- [ ] T031 [P] Create frontend/src/styles/accessibility.css with focus states, sr-only class
- [ ] T032 Create frontend/src/services/api.js with fetch wrapper, error handling, baseURL configuration
- [ ] T033 Create frontend/src/services/auth-service.js with login, logout, getCurrentUser, auth state management
- [ ] T034 Create frontend/src/services/storage.js with localStorage wrapper for user preferences
- [ ] T035 Create frontend/src/utils/dom.js with DOM manipulation helpers (createElement, mount, unmount)
- [ ] T036 [P] Create frontend/src/utils/formatters.js with date, number, file size formatters
- [ ] T037 [P] Create frontend/src/utils/validators.js with client-side validation functions
- [ ] T038 Create frontend/src/router.js with client-side routing using History API
- [ ] T039 Create frontend/src/services/event-bus.js with custom event bus for component communication
- [ ] T040 Create frontend/src/components/common/header.js with navigation, user role display, logout
- [ ] T041 Create frontend/src/components/common/header.css with responsive header styles
- [ ] T042 [P] Create frontend/src/components/common/footer.js
- [ ] T043 [P] Create frontend/src/components/common/footer.css
- [ ] T044 [P] Create frontend/src/components/common/modal.js with reusable modal component
- [ ] T045 [P] Create frontend/src/components/common/modal.css
- [ ] T046 [P] Create frontend/src/components/common/notification.js with toast notifications
- [ ] T047 [P] Create frontend/src/components/common/notification.css
- [ ] T048 Create frontend/src/main.js with app initialization, router setup, auth check

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Wildlife Activity and Insights (Priority: P1) 🎯 MVP

**Goal**: Users can browse processed images, view statistics, filter by date/species, and see maps

**Independent Test**: Create sample processed images with detections in database, verify users can view gallery, apply filters, see statistics dashboard, and view maps with camera locations

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T049 [P] [US1] Contract test for GET /api/images in backend/tests/contract/images.test.js
- [ ] T050 [P] [US1] Contract test for GET /api/images/:id in backend/tests/contract/images.test.js
- [ ] T051 [P] [US1] Contract test for GET /api/detections in backend/tests/contract/detections.test.js
- [ ] T052 [P] [US1] Contract test for GET /api/species in backend/tests/contract/species.test.js
- [ ] T053 [P] [US1] Contract test for GET /api/statistics/summary in backend/tests/contract/statistics.test.js
- [ ] T054 [P] [US1] Contract test for GET /api/maps in backend/tests/contract/maps.test.js
- [ ] T055 [US1] Integration test for user viewing images workflow in backend/tests/integration/user-viewing.test.js

### Backend Implementation for User Story 1

- [ ] T056 [P] [US1] Implement backend/src/services/images.js with getImages (pagination, filters), getImageById, getImageFile
- [ ] T057 [P] [US1] Implement backend/src/services/statistics.js with getSummary, getSpeciesFrequency, getTemporalPatterns, computeInsights
- [ ] T058 [P] [US1] Implement backend/src/services/maps.js with getMaps (filter by is_shared), getMapById with locations
- [ ] T059 [US1] Add GET /api/images routes in backend/src/api/routes.js with pagination, filtering
- [ ] T060 [US1] Add GET /api/images/:id route in backend/src/api/routes.js
- [ ] T061 [US1] Add GET /api/images/:id/file route with thumbnail parameter in backend/src/api/routes.js
- [ ] T062 [US1] Add GET /api/detections route in backend/src/api/routes.js
- [ ] T063 [US1] Add GET /api/species route in backend/src/api/routes.js
- [ ] T064 [US1] Add GET /api/statistics/* routes (summary, species-frequency, temporal-patterns) in backend/src/api/routes.js
- [ ] T065 [US1] Add GET /api/maps routes in backend/src/api/routes.js
- [ ] T066 [US1] Add GET /api/maps/:id route in backend/src/api/routes.js

### Frontend Implementation for User Story 1

- [ ] T067 [P] [US1] Create frontend/src/components/auth/login-form.js with username, password inputs, submit handler
- [ ] T068 [P] [US1] Create frontend/src/components/auth/login-form.css with form styles
- [ ] T069 [P] [US1] Create frontend/src/components/images/gallery.js with grid layout, image cards, pagination controls
- [ ] T070 [P] [US1] Create frontend/src/components/images/gallery.css with responsive grid, card styles
- [ ] T071 [P] [US1] Create frontend/src/components/images/filters.js with date range, species dropdown, location filter controls
- [ ] T072 [P] [US1] Create frontend/src/components/images/image-detail.js with modal showing detections, bounding boxes, metadata
- [ ] T073 [P] [US1] Create frontend/src/components/statistics/dashboard.js with summary cards, species counts
- [ ] T074 [P] [US1] Create frontend/src/components/statistics/dashboard.css with dashboard grid layout
- [ ] T075 [P] [US1] Create frontend/src/components/statistics/charts.js with canvas-based bar/line charts for temporal patterns
- [ ] T076 [P] [US1] Create frontend/src/components/maps/map-viewer.js with Leaflet.js map, camera location markers, popups
- [ ] T077 [P] [US1] Create frontend/src/components/maps/map-viewer.css with map container, marker styles
- [ ] T078 [US1] Create frontend/src/pages/login.js with login form, redirect after auth
- [ ] T079 [US1] Create frontend/src/pages/gallery.js with gallery component, filters, image detail modal
- [ ] T080 [US1] Create frontend/src/pages/statistics.js with dashboard and charts
- [ ] T081 [US1] Create frontend/src/pages/maps.js with map viewer and map selector
- [ ] T082 [US1] Update frontend/src/router.js to handle /login, /gallery, /statistics, /maps routes
- [ ] T083 [US1] Update frontend/src/services/api.js with methods: fetchImages, fetchImageById, fetchDetections, fetchSpecies, fetchStatistics, fetchMaps
- [ ] T084 [US1] Add authentication redirect in frontend/src/router.js to redirect unauthenticated users to /login

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Administrator Image Upload and Batch Processing (Priority: P2)

**Goal**: Administrators can upload images, initiate batch processing, monitor progress, and see results

**Independent Test**: Login as admin, upload test images, initiate processing, verify Docker container runs, detections are stored, and progress is displayed

### Tests for User Story 2 ⚠️

- [ ] T085 [P] [US2] Contract test for POST /api/images in backend/tests/contract/upload.test.js
- [ ] T086 [P] [US2] Contract test for POST /api/processing/jobs in backend/tests/contract/processing.test.js
- [ ] T087 [P] [US2] Contract test for GET /api/processing/jobs/:id in backend/tests/contract/processing.test.js
- [ ] T088 [US2] Integration test for admin upload and processing workflow in backend/tests/integration/admin-processing.test.js

### Backend Implementation for User Story 2

- [ ] T089 [US2] Create backend/src/utils/hash.js with SHA-256 file hashing for duplicate detection
- [ ] T090 [US2] Implement backend/src/services/upload.js with handleUpload (Multer), saveToDisk, extractEXIF, checkDuplicates
- [ ] T091 [US2] Implement backend/src/services/processing.js with createJob, startProcessing, spawnDockerContainer, parseResults, updateJobProgress
- [ ] T092 [US2] Add POST /api/images route with requireAdmin, Multer middleware in backend/src/api/routes.js
- [ ] T093 [US2] Add POST /api/processing/jobs route with requireAdmin in backend/src/api/routes.js
- [ ] T094 [US2] Add GET /api/processing/jobs routes in backend/src/api/routes.js
- [ ] T095 [US2] Add GET /api/processing/jobs/:id route in backend/src/api/routes.js

### Docker Image Processing Container

- [ ] T096 [P] [US2] Create backend/docker/processor/Dockerfile with Python 3.11, PyTorch, OpenCV dependencies
- [ ] T097 [P] [US2] Create backend/docker/processor/requirements.txt with torch, torchvision, opencv-python, Pillow
- [ ] T098 [US2] Create backend/docker/processor/process.py with MegaDetector model loading, wildlife detection, species classification
- [ ] T099 [US2] Add thumbnail generation in backend/docker/processor/process.py using Pillow
- [ ] T100 [US2] Add JSON output format in backend/docker/processor/process.py (detections with species, confidence, bounding boxes)
- [ ] T101 [US2] Download MegaDetector model to backend/docker/processor/models/ directory
- [ ] T102 [US2] Create backend/docker/docker-compose.yml for optional orchestration

### Frontend Implementation for User Story 2

- [ ] T103 [P] [US2] Create frontend/src/components/images/upload.js with file input (multiple), drag-and-drop, upload progress
- [ ] T104 [P] [US2] Create frontend/src/components/images/upload.css with dropzone, progress bar styles
- [ ] T105 [US2] Create frontend/src/pages/upload.js with upload component, processing job status, results summary
- [ ] T106 [US2] Update frontend/src/router.js to add /upload route (admin only)
- [ ] T107 [US2] Update frontend/src/services/api.js with uploadImages, createProcessingJob, fetchJobStatus methods
- [ ] T108 [US2] Add admin-only route guard in frontend/src/router.js for /upload

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Administrator Map Creation and Sharing (Priority: P3)

**Goal**: Administrators can create maps, add camera locations, share maps; users can view shared maps

**Independent Test**: Login as admin, create map, add camera locations with lat/lng, share map, login as regular user and verify map is visible

### Tests for User Story 3 ⚠️

- [ ] T109 [P] [US3] Contract test for POST /api/maps in backend/tests/contract/maps.test.js
- [ ] T110 [P] [US3] Contract test for PUT /api/maps/:id in backend/tests/contract/maps.test.js
- [ ] T111 [P] [US3] Contract test for POST /api/maps/:id/locations in backend/tests/contract/maps.test.js
- [ ] T112 [US3] Integration test for admin map creation and sharing workflow in backend/tests/integration/admin-maps.test.js

### Backend Implementation for User Story 3

- [ ] T113 [US3] Add createMap, updateMap, deleteMap to backend/src/services/maps.js
- [ ] T114 [US3] Add addCameraLocation, updateCameraLocation, deleteCameraLocation to backend/src/services/maps.js
- [ ] T115 [US3] Add POST /api/maps route with requireAdmin in backend/src/api/routes.js
- [ ] T116 [US3] Add PUT /api/maps/:id route with requireAdmin in backend/src/api/routes.js
- [ ] T117 [US3] Add DELETE /api/maps/:id route with requireAdmin in backend/src/api/routes.js
- [ ] T118 [US3] Add POST /api/maps/:id/locations route with requireAdmin in backend/src/api/routes.js
- [ ] T119 [US3] Add PUT /api/maps/:id/locations/:locationId route with requireAdmin in backend/src/api/routes.js
- [ ] T120 [US3] Add DELETE /api/maps/:id/locations/:locationId route with requireAdmin in backend/src/api/routes.js

### Frontend Implementation for User Story 3

- [ ] T121 [P] [US3] Create frontend/src/components/maps/map-editor.js with Leaflet.js, click-to-add markers, edit mode
- [ ] T122 [P] [US3] Create frontend/src/components/maps/map-editor.css with editor controls, marker edit styles
- [ ] T123 [US3] Add map creation form in frontend/src/components/maps/map-editor.js (name, description, share toggle)
- [ ] T124 [US3] Add camera location form in frontend/src/components/maps/map-editor.js (label input, lat/lng from click)
- [ ] T125 [US3] Update frontend/src/pages/maps.js to show map editor for admins, viewer for regular users
- [ ] T126 [US3] Update frontend/src/services/api.js with createMap, updateMap, deleteMap, addCameraLocation methods

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T127 [P] Add seed script in backend/scripts/seed.js to create default admin user and test data
- [ ] T128 [P] Add database backup script in backend/scripts/backup.js
- [ ] T129 [P] Create backend/tests/unit/services/images.test.js for image service unit tests
- [ ] T130 [P] Create backend/tests/unit/services/statistics.test.js for statistics service unit tests
- [ ] T131 [P] Create backend/tests/unit/services/upload.test.js for upload service unit tests
- [ ] T132 [P] Create backend/tests/unit/services/processing.test.js for Docker processing service unit tests
- [ ] T133 [P] Create backend/tests/unit/services/maps.test.js for maps service unit tests
- [ ] T134 [P] Create frontend/tests/unit/services/api.test.js for API client unit tests
- [ ] T135 [P] Create frontend/tests/integration/gallery.test.js for gallery integration tests
- [ ] T136 Add performance benchmarking script in backend/tests/benchmark.js for load testing
- [ ] T137 Add accessibility testing script in frontend/tests/a11y.test.js using axe-core
- [ ] T138 Update README.md with complete setup instructions, Docker build steps, troubleshooting
- [ ] T139 Create .env.production.example with production configuration guidance
- [ ] T140 Add GitHub Actions CI/CD workflow in .github/workflows/ci.yml for linting, tests, build
- [ ] T141 Run quickstart.md validation (setup from scratch, verify all workflows)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable (admin views use US1 gallery components)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1 (map viewer reused) but should be independently testable

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- Backend services before API routes
- Frontend components before pages
- API client methods before frontend components that use them
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Backend services marked [P] can run in parallel (different files)
- Frontend components marked [P] can run in parallel (different files)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T049: Contract test for GET /api/images
Task T050: Contract test for GET /api/images/:id
Task T051: Contract test for GET /api/detections
Task T052: Contract test for GET /api/species
Task T053: Contract test for GET /api/statistics/summary
Task T054: Contract test for GET /api/maps

# Launch all backend services for User Story 1 together:
Task T056: Implement backend/src/services/images.js
Task T057: Implement backend/src/services/statistics.js
Task T058: Implement backend/src/services/maps.js

# Launch all frontend components for User Story 1 together:
Task T067: Create frontend/src/components/auth/login-form.js
Task T069: Create frontend/src/components/images/gallery.js
Task T071: Create frontend/src/components/images/filters.js
Task T072: Create frontend/src/components/images/image-detail.js
Task T073: Create frontend/src/components/statistics/dashboard.js
Task T075: Create frontend/src/components/statistics/charts.js
Task T076: Create frontend/src/components/maps/map-viewer.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T014)
2. Complete Phase 2: Foundational (T015-T048) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T049-T084)
4. **STOP and VALIDATE**: Test User Story 1 independently with sample data
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Frontend focus)
   - Developer B: User Story 1 (Backend focus)
   - Developer C: User Story 2 (Docker + Backend)
3. OR: Each developer takes one user story end-to-end
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All file paths are exact and follow plan.md structure
- Constitution requirements: 80%+ test coverage, accessibility WCAG 2.1 AA, <500ms API p95, <100ms UI feedback
