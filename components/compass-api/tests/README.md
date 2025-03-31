# Tech Compass API Testing Strategy

## Overview

This document outlines the unit testing strategy for the Tech Compass API. All tests are focused exclusively on the API (Router) level, ensuring that the endpoints function correctly with proper request handling, authentication, and data validation.

## Testing Approach

### Key Principles

1. **API-Level Testing Only**: Tests focus on the router layer, validating endpoint behavior, request/response handling, and integration with services.
2. **Real Database Testing**: Tests use a real MongoDB instance (local) rather than mocks to ensure database interactions work correctly.
3. **Isolated Test Environment**: Each test run uses a dedicated test database that is reset between test sessions.
4. **Complete Coverage**: All API endpoints should have corresponding test cases covering various scenarios.

## Test Environment Setup

### Database Configuration

- **Database Name**: `tc-test` (dedicated test database)
- **Connection**: Local MongoDB instance
- **Reset Strategy**: Database is reset before each test session

### Test Dependencies

All test dependencies are specified in `requirements-test.txt`:

- pytest
- pytest-asyncio
- httpx
- pytest-cov
- faker

## Test Organization

### Directory Structure

```
tests/
├── conftest.py           # Test fixtures and configuration
├── test_auth.py          # Authentication endpoint tests
├── test_solutions.py     # Solution endpoint tests
├── test_categories.py    # Category endpoint tests
...
```

### Test Fixtures

The `conftest.py` file should contain:

1. **Database Setup/Teardown**: Fixtures to initialize and reset the test database
2. **Test Client**: FastAPI TestClient setup
3. **Authentication**: Fixtures for authenticated test requests
4. **Test Data**: Common test data used across multiple tests

## Testing Specific API Endpoints

### Authentication Endpoints

- Test user login with valid/invalid credentials
- Test token validation
- Test user registration
- Test password reset functionality

### Solution Endpoints

- Test creating solutions (authenticated/unauthenticated)
- Test retrieving solutions (filtering, pagination)
- Test updating solutions (permissions, validation)
- Test deleting solutions (permissions)
- Test solution search functionality

### Category Endpoints

- Test category creation, retrieval, update, and deletion
- Test category association with solutions

### User Endpoints

- Test user creation and management
- Test user permissions and roles

### Comment and Rating Endpoints

- Test adding/retrieving comments and ratings
- Test permissions for modifying comments

### Tech Radar Endpoints

- Test radar visualization data endpoints
- Test radar configuration endpoints

## Implementation Guidelines

### Test Case Structure

```python
async def test_endpoint_functionality(client, db, auth_headers):
    # Setup test data
    # ...

    # Make request to endpoint
    response = await client.post("/api/endpoint", json=data, headers=auth_headers)

    # Assert response
    assert response.status_code == 200
    assert response.json()["data"]["field"] == expected_value
```

### Database Reset Implementation

```python
@pytest.fixture(scope="session")
async def db():
    # Override settings for test database
    from app.core.config import settings
    settings.DATABASE_NAME = "tc-test"

    # Connect to MongoDB
    from app.core.mongodb import connect_to_mongo, close_mongo_connection
    await connect_to_mongo()

    # Clear all collections before tests
    db = get_database()
    collections = await db.list_collection_names()
    for collection in collections:
        await db[collection].delete_many({})

    yield db

    # Cleanup after tests
    await close_mongo_connection()
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app

# Run specific test file
pytest tests/test_solutions.py
```

## Continuous Integration

Tests should be integrated into the CI/CD pipeline to ensure code quality before deployment:

1. Run tests on every pull request
2. Generate and store coverage reports
3. Block merging if tests fail or coverage drops below threshold

## Best Practices

1. **Isolation**: Each test should be independent and not rely on state from other tests
2. **Descriptive Names**: Test names should clearly describe what they're testing
3. **Comprehensive Assertions**: Test both happy paths and error conditions
4. **Clean Setup/Teardown**: Properly initialize and clean up test data
5. **Avoid Test Interdependence**: Tests should not depend on each other's execution order
