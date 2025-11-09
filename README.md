# Bambi Basher - Trail Camera Image Processing System

A multi-user web application for processing and analyzing trail camera images with automated wildlife detection and species identification.

## Features

- 🦌 **Wildlife Detection**: Automated detection and species identification using machine learning
- 📊 **Analytics Dashboard**: View statistics, activity patterns, and species frequency
- 🗺️ **Geographic Mapping**: Visualize camera locations and wildlife sightings on interactive maps
- 👥 **Multi-User Support**: Role-based access control (Administrators and Regular Users)
- 🐳 **Docker Processing**: Isolated image processing with optional GPU acceleration
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Vite + Vanilla JavaScript + Leaflet.js
- **Backend**: Node.js (v20+) + Express + SQLite
- **Processing**: Docker + Python + PyTorch/OpenCV
- **Testing**: Vitest

## Prerequisites

- Node.js v20 LTS or later
- Docker v24 or later
- npm v9 or later
- Git

## Quick Start

### 1. Clone and Setup

\`\`\`bash
git clone <repository-url>
cd bambi_basher
git checkout 001-trail-camera-processing
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install all workspace dependencies
npm run install:all

# Or install individually
cd backend && npm install
cd ../frontend && npm install
\`\`\`

### 3. Configure Environment

\`\`\`bash
# Copy example environment file
cp backend/.env.example backend/.env

# Edit backend/.env and set your configuration
# Minimum: Set SESSION_SECRET to a random string
\`\`\`

### 4. Initialize Database

\`\`\`bash
cd backend
npm run db:migrate
npm run db:seed  # Creates default admin user (admin/admin123)
\`\`\`

### 5. Build Docker Image for Processing

\`\`\`bash
cd backend/docker/processor
docker build -t trailcam-processor:latest .
\`\`\`

For GPU support:
\`\`\`bash
docker build -t trailcam-processor:latest-gpu -f Dockerfile.gpu .
\`\`\`

### 6. Run Development Servers

\`\`\`bash
# From project root - runs both frontend and backend
npm run dev

# Or run separately in different terminals:
npm run dev:backend   # Backend on http://localhost:3000
npm run dev:frontend  # Frontend on http://localhost:5173
\`\`\`

### 7. Access Application

Open http://localhost:5173 in your browser

**Default Credentials**:
- Username: `admin`
- Password: `admin123`

⚠️ **Change the default password immediately in production!**

## Project Structure

\`\`\`
bambi_basher/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── api/            # Express routes and middleware
│   │   ├── db/             # Database schema and migrations
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities (logging, errors)
│   ├── storage/            # File storage (gitignored)
│   ├── docker/             # Docker processing container
│   └── tests/              # Backend tests
├── frontend/               # Frontend web application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API client, auth
│   │   ├── styles/         # CSS (design system)
│   │   └── utils/          # DOM helpers, formatters
│   └── tests/              # Frontend tests
└── specs/                  # Feature specifications and planning

\`\`\`

## Development

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Backend tests
npm run test:backend
cd backend && npm run test:unit
cd backend && npm run test:integration
cd backend && npm run test:contract

# Frontend tests
npm run test:frontend

# Coverage report
cd backend && npm run test:coverage
\`\`\`

### Linting

\`\`\`bash
# Lint all code
npm run lint

# Auto-fix issues
npm run lint:fix
\`\`\`

### Database Operations

\`\`\`bash
cd backend

# Run migrations
npm run db:migrate

# Seed database with test data
npm run db:seed

# Backup database
npm run db:backup
\`\`\`

### Testing Image Processing

\`\`\`bash
cd backend
npm run process:test
\`\`\`

## Constitution

This project follows strict development principles defined in [`.specify/memory/constitution.md`](.specify/memory/constitution.md):

1. **Code Quality First**: 80%+ test coverage, cyclomatic complexity ≤10, code reviews required
2. **Test-Driven Development**: Tests written before implementation (red-green-refactor)
3. **User Experience Consistency**: WCAG 2.1 Level AA accessibility, <100ms UI feedback
4. **Performance & Reliability**: <500ms API response p95, structured logging, graceful error handling

## Documentation

- [Feature Specification](specs/001-trail-camera-processing/spec.md) - User stories and requirements
- [Implementation Plan](specs/001-trail-camera-processing/plan.md) - Architecture and design
- [Data Model](specs/001-trail-camera-processing/data-model.md) - Database schema
- [API Contracts](specs/001-trail-camera-processing/contracts/api.yaml) - OpenAPI specification
- [Quickstart Guide](specs/001-trail-camera-processing/quickstart.md) - Detailed setup and development guide
- [Tasks](specs/001-trail-camera-processing/tasks.md) - Implementation task breakdown

## Contributing

1. Follow the TDD workflow (write tests first)
2. Ensure all tests pass: `npm test`
3. Lint your code: `npm run lint:fix`
4. Verify 80%+ coverage: `npm run test:coverage`
5. Run accessibility tests: `cd frontend && npm run test:a11y`

## License

MIT

## Support

For issues and questions, please refer to the [Quickstart Guide](specs/001-trail-camera-processing/quickstart.md) or create an issue in the repository.
