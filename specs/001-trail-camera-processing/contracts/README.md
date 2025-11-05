# API Contract Testing

This directory contains the OpenAPI 3.0 specification for the Trail Camera Image Processing API.

## Files

- `api.yaml`: Complete OpenAPI specification defining all endpoints, request/response schemas, and authentication

## Contract Testing Guidelines

### Purpose

Contract tests verify that the API implementation matches the OpenAPI specification. These tests ensure:

1. **Schema Compliance**: Responses match defined schemas
2. **Status Codes**: Endpoints return correct HTTP status codes
3. **Authentication**: Security requirements are enforced
4. **Validation**: Request validation works as specified

### Tools

Use the following tools for contract testing:

- **openapi-validator**: Validate OpenAPI spec syntax
- **@apidevtools/swagger-parser**: Parse and validate schema
- **ajv**: JSON schema validation in tests
- **supertest**: HTTP testing for Express.js

### Writing Contract Tests

Example contract test using Vitest + supertest:

```javascript
import { describe, test, expect } from 'vitest';
import request from 'supertest';
import Ajv from 'ajv';
import openapiSpec from '../specs/001-trail-camera-processing/contracts/api.yaml';

const ajv = new Ajv();

describe('GET /api/images', () => {
  test('should return paginated images matching schema', async () => {
    const response = await request(app)
      .get('/api/images?page=1&limit=20')
      .set('Cookie', validSessionCookie)
      .expect(200);

    // Validate response schema
    const imageListSchema = openapiSpec.components.schemas.Image;
    const paginationSchema = openapiSpec.components.schemas.Pagination;

    expect(response.body).toHaveProperty('images');
    expect(response.body).toHaveProperty('pagination');

    // Validate each image matches schema
    response.body.images.forEach(image => {
      const valid = ajv.validate(imageListSchema, image);
      expect(valid).toBe(true);
    });

    // Validate pagination
    const validPagination = ajv.validate(paginationSchema, response.body.pagination);
    expect(validPagination).toBe(true);
  });

  test('should return 401 for unauthenticated requests', async () => {
    await request(app)
      .get('/api/images')
      .expect(401);
  });
});
```

### Test Coverage Requirements

Contract tests MUST cover:

1. **All Endpoints**: Every path in `api.yaml` must have at least one test
2. **Authentication**: Verify 401 responses for protected endpoints
3. **Authorization**: Verify 403 responses for admin-only endpoints accessed by regular users
4. **Validation**: Test request validation (400 responses for invalid input)
5. **Error Responses**: Verify error response schemas match spec
6. **Edge Cases**: Test boundary conditions (empty lists, pagination limits, etc.)

### Running Contract Tests

```bash
# From backend directory
npm run test:contract

# With coverage
npm run test:contract -- --coverage
```

### CI/CD Integration

Contract tests should run:

- On every pull request
- Before merging to main branch
- Before deploying to production

### Updating the Spec

When modifying the API:

1. Update `api.yaml` first
2. Update corresponding contract tests
3. Implement API changes
4. Verify contract tests pass
5. Commit spec + tests + implementation together

### Validation Checklist

Before deploying, ensure:

- [ ] `api.yaml` passes OpenAPI validation
- [ ] All contract tests pass
- [ ] New endpoints have contract tests
- [ ] Changed endpoints have updated tests
- [ ] Error responses match spec
- [ ] Authentication/authorization enforced
