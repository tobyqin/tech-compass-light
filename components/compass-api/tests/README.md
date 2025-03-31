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
├── run_tests.sh          # General test runner script
└── run_auth_tests.sh     # Legacy script to run auth API tests
```

### Test Configuration

The `conftest.py` file contains:

1. **Environment Variables**: All test environment variables are set in this file
2. **Settings Override**: Direct overrides of app settings for testing
3. **Test Fixtures**: Common fixtures for database setup/teardown, test clients, and authentication
4. **Helper Functions**: Utility functions for testing

## Running Tests

### Using the General Test Runner

The `run_tests.sh` script provides a flexible way to run tests:

```bash
# Run all tests
./tests/run_tests.sh

# Run with coverage report for all modules
./tests/run_tests.sh --coverage

# Run tests for a specific module
./tests/run_tests.sh --module auth

# Run tests for a specific module with coverage
./tests/run_tests.sh --module auth --coverage
```

### Using pytest directly

You can also use pytest commands directly:

```bash
# Run all tests
python -m pytest tests/

# Run with coverage report
python -m pytest tests/ --cov=app

# Run specific test file
python -m pytest tests/test_auth.py

# Run specific test
python -m pytest tests/test_auth.py::TestAuthEndpoints::test_login_admin_success
```

## Testing Specific API Endpoints

### Authentication Endpoints

Authentication tests in `test_auth.py` cover:

- Admin user login with valid credentials
- Login attempts with incorrect username/password (should be rejected)
- Login attempts with empty or missing credentials
- Token structure and expiration validation

Current coverage: 94%

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
def test_endpoint_functionality(client, admin_headers):
    # Setup test data
    # ...

    # Make request to endpoint
    response = client.post("/api/endpoint", json=data, headers=admin_headers)

    # Assert response
    assert response.status_code == 200
    assert response.json()["data"]["field"] == expected_value
```

### Database Reset Implementation

The conftest.py file implements a database reset strategy between test sessions.

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
