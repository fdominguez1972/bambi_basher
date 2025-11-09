# Quickstart: Trail Camera Image Processing System

**Feature**: Trail Camera Image Processing System
**Branch**: `001-trail-camera-processing`
**Date**: 2025-11-04

## Overview

This guide walks you through setting up the development environment, running the application locally, and understanding the project structure.

## Prerequisites

Ensure you have the following installed:

- **Node.js v20 LTS** or later ([Download](https://nodejs.org/))
- **npm** v9 or later (comes with Node.js)
- **Docker** v24 or later ([Download](https://www.docker.com/products/docker-desktop))
- **Git** for version control
- **Code Editor**: VS Code recommended with ESLint and Prettier extensions

### Optional for GPU Acceleration

- **NVIDIA GPU** with CUDA support
- **NVIDIA Docker Runtime** ([Setup Guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html))

## Initial Setup

### 1. Clone Repository and Switch to Feature Branch

```bash
git clone <repository-url>
cd bambi_basher
git checkout 001-trail-camera-processing
```

### 2. Install Dependencies

```bash
# Install root dependencies (if any)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create `.env` files for backend configuration:

```bash
# backend/.env
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key-change-in-production
DB_PATH=./storage/database/trailcam.db
STORAGE_PATH=./storage/images
THUMBNAIL_PATH=./storage/thumbnails
DOCKER_IMAGE=trailcam-processor:latest
LOG_LEVEL=debug
```

**Security Note**: Never commit `.env` files. Use `.env.example` as a template.

### 4. Initialize Database

Run database migrations to create schema:

```bash
cd backend
npm run db:migrate
```

This creates the SQLite database and runs all migration scripts in `src/db/migrations/`.

### 5. Seed Default Data (Optional)

Create a default admin user and seed species data:

```bash
npm run db:seed
```

Default credentials (change immediately):
- **Username**: `admin`
- **Password**: `admin123`

### 6. Build Docker Image for Processing

Build the image processing container:

```bash
cd backend/docker/processor
docker build -t trailcam-processor:latest .
```

**For GPU Support**:

```bash
docker build -t trailcam-processor:latest-gpu -f Dockerfile.gpu .
```

Verify the image is built:

```bash
docker images | grep trailcam-processor
```

## Running the Application

### Development Mode

#### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```

This starts the Express server on `http://localhost:3000` with hot-reload enabled (nodemon).

#### Terminal 2: Frontend Dev Server

```bash
cd frontend
npm run dev
```

This starts the Vite dev server on `http://localhost:5173` with hot module replacement.

#### Terminal 3: Docker Processing (Optional)

Processing jobs are triggered via the admin UI. Docker containers spawn automatically when batch processing is initiated.

To test Docker processing manually:

```bash
# From backend directory
npm run process:test
```

This runs a test processing job on sample images.

### Access the Application

1. Open browser: `http://localhost:5173`
2. Login with default admin credentials
3. Navigate to Upload page to upload test images
4. Initiate batch processing
5. View results in Gallery and Statistics pages

## Project Structure Reference

```
backend/
├── src/
│   ├── db/                    # Database layer
│   ├── services/              # Business logic
│   ├── api/                   # Express routes and middleware
│   ├── utils/                 # Utilities (logging, errors, hashing)
│   └── server.js              # Entry point
├── storage/                   # File storage (gitignored)
├── docker/processor/          # Image processing container
└── tests/                     # Backend tests

frontend/
├── src/
│   ├── components/            # UI components
│   ├── pages/                 # Page-level components
│   ├── services/              # API client, auth
│   ├── utils/                 # DOM helpers, formatters
│   ├── styles/                # Global CSS
│   └── main.js                # Entry point
├── public/                    # Static assets
└── tests/                     # Frontend tests
```

## Development Workflow

### 1. TDD Cycle (Per Constitution)

**IMPORTANT**: Follow Test-Driven Development strictly.

1. Write failing test
2. Run test suite: `npm run test`
3. Implement minimal code to pass test
4. Refactor while keeping tests green
5. Commit

Example TDD workflow for a new feature:

```bash
# 1. Write test (backend/tests/unit/services/auth.test.js)
# 2. Run tests
cd backend
npm run test

# 3. Implement feature (backend/src/services/auth.js)
# 4. Re-run tests until passing
npm run test

# 5. Commit
git add .
git commit -m "feat: add password reset functionality

- Add resetPassword method to auth service
- Validate reset token expiration
- Update password hash on successful reset

Tests:
- ✓ Valid token resets password
- ✓ Expired token returns error
- ✓ Invalid token returns error"
```

### 2. Code Quality Checks

Before committing, run linters:

```bash
# Backend linting
cd backend
npm run lint
npm run lint:fix  # Auto-fix issues

# Frontend linting
cd frontend
npm run lint
npm run lint:fix
```

### 3. Running Tests

```bash
# Backend tests
cd backend
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:contract     # API contract tests
npm run test:coverage     # Generate coverage report

# Frontend tests
cd frontend
npm run test
npm run test:coverage
```

**Coverage Requirement**: 80% minimum per constitution.

### 4. Database Migrations

When modifying database schema:

1. Create new migration file:

```bash
cd backend
npm run db:migration:create add_new_feature
```

This creates `backend/src/db/migrations/00X_add_new_feature.sql`.

2. Write SQL:

```sql
-- 002_add_new_feature.sql
ALTER TABLE images ADD COLUMN gps_latitude REAL;
ALTER TABLE images ADD COLUMN gps_longitude REAL;

CREATE INDEX idx_images_gps ON images(gps_latitude, gps_longitude);
```

3. Apply migration:

```bash
npm run db:migrate
```

4. Test rollback (ensure backward compatibility):

```bash
npm run db:rollback
npm run db:migrate
```

### 5. Adding New API Endpoints

1. Update OpenAPI spec: `specs/001-trail-camera-processing/contracts/api.yaml`
2. Write contract test: `backend/tests/contract/new-endpoint.test.js`
3. Implement route: `backend/src/api/routes.js`
4. Implement service logic: `backend/src/services/`
5. Run contract tests: `npm run test:contract`
6. Update frontend API client: `frontend/src/services/api.js`

### 6. Creating UI Components

Follow vanilla JS component pattern:

```javascript
// frontend/src/components/example/my-component.js
export function createMyComponent(props) {
  const container = document.createElement('div');
  container.className = 'my-component';

  container.innerHTML = `
    <h2>${props.title}</h2>
    <p>${props.content}</p>
  `;

  // Event handling
  container.querySelector('button')?.addEventListener('click', () => {
    props.onClick();
  });

  return container;
}
```

```css
/* frontend/src/components/example/my-component.css */
.my-component {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius);
}
```

## Debugging

### Backend Debugging

Use Node.js debugger with VS Code:

1. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/server.js",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

2. Set breakpoints in code
3. Press F5 to start debugging

### Frontend Debugging

Use browser DevTools:

1. Open Chrome DevTools (F12)
2. Navigate to Sources tab
3. Set breakpoints in JavaScript files
4. Inspect network requests, console logs, and DOM

### Docker Processing Debugging

View Docker container logs:

```bash
# List running containers
docker ps

# View logs for specific container
docker logs <container-id>

# Follow logs in real-time
docker logs -f <container-id>

# Execute shell in container for debugging
docker exec -it <container-id> /bin/bash
```

## Testing Image Processing

### Upload Test Images

1. Prepare test images (trail camera photos or wildlife images)
2. Navigate to Upload page (admin only)
3. Select multiple images
4. Click "Upload"
5. Initiate batch processing
6. Monitor processing job status
7. View results in Gallery

### GPU Acceleration Testing

Verify GPU is being used:

```bash
# Check if GPU available in container
docker run --gpus all trailcam-processor:latest-gpu python -c "import torch; print(torch.cuda.is_available())"
```

Expected output: `True`

## Performance Benchmarking

Run load tests to verify performance criteria:

```bash
cd backend
npm run benchmark
```

This tests:
- API response times (target: <500ms p95)
- Database query performance
- Concurrent user load (target: 50 users)

## Common Issues

### Issue: Database locked error

**Solution**: Ensure only one process accesses SQLite. Stop all dev servers and restart.

### Issue: Docker container won't start

**Solution**: Check Docker daemon is running:

```bash
docker info
```

Rebuild image if needed:

```bash
docker build -t trailcam-processor:latest backend/docker/processor/
```

### Issue: Frontend can't connect to backend

**Solution**: Verify backend is running on port 3000 and CORS is configured correctly in `backend/src/server.js`.

### Issue: Session not persisting

**Solution**: Check cookies are enabled. Verify `SESSION_SECRET` is set in backend `.env`.

### Issue: Image upload fails

**Solution**: Check storage directory exists and has write permissions:

```bash
mkdir -p backend/storage/images backend/storage/thumbnails
chmod -R 755 backend/storage
```

## Accessibility Testing

Per constitution (WCAG 2.1 Level AA), test accessibility:

1. **Keyboard Navigation**: Navigate entire app using only Tab, Enter, Space, Arrow keys
2. **Screen Reader**: Test with NVDA (Windows) or VoiceOver (macOS)
3. **Contrast**: Use axe DevTools or Lighthouse to check color contrast
4. **Focus Indicators**: Verify all interactive elements have visible focus states

Run automated accessibility audit:

```bash
cd frontend
npm run test:a11y
```

## Next Steps

1. **Generate Tasks**: Run `/speckit.tasks` to create implementation task list
2. **Implement Features**: Follow TDD workflow for each task
3. **Review Constitution**: Ensure all code meets quality, testing, UX, and performance standards
4. **Deploy**: Follow deployment guide for production setup

## Resources

- [Specification](spec.md) - Feature requirements
- [Implementation Plan](plan.md) - Architecture and design decisions
- [Data Model](data-model.md) - Database schema
- [API Contracts](contracts/api.yaml) - OpenAPI specification
- [Research](research.md) - Technology decisions and best practices
- [Constitution](../.specify/memory/constitution.md) - Project governance and principles

## Getting Help

- Check existing tests for examples
- Review research.md for technology best practices
- Consult OpenAPI spec for API contracts
- Follow constitution guidelines for quality standards
