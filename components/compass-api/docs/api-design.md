# API Design Document

## Overview

This document details the API design for the Tech Compass (TC) platform. The API follows RESTful principles and uses JSON for data exchange.

## 1. General Specifications

### 1.1 Base URL

- Development: `http://localhost:8000/api`

### 1.2 Standard Response Format

```json
{
  "success": true|false,
  "data": {
    // Response data
  },
  "total": 100, // only for list endpoints
  "skip": 0, // only for list endpoints
  "limit": 20, // only for list endpoints
}
```

### 1.3 HTTP Status Codes

Common HTTP status codes used in the API:

- 200: OK - Request successful
- 201: Created - Resource created successfully
- 204: No Content - Request successful, no content returned
- 400: Bad Request - Invalid request parameters
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 409: Conflict - Resource conflict (e.g., duplicate slug)
- 422: Unprocessable Entity - Validation error
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Server error

### 1.4 Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details if available
    }
  }
}
```

### 1.5 Authentication

- JWT-based authentication
- Token included in Authorization header: `Authorization: Bearer <token>`
- Token expiration: 24 hours
- Refresh token mechanism for extended sessions
- Token endpoints:
  - POST /api/auth/login

## 2. Security Considerations

### 2.1 Authentication and Authorization

- All modification endpoints require authentication
- Role-based access control (RBAC) for sensitive operations
- Token expiration and refresh mechanism
- HTTPS required for all API calls

### 2.2 Data Validation

- Input validation on all endpoints
- Request size limits
- Content type verification
- XSS protection
- SQL injection protection

### 2.3 Security Headers

- CORS configuration
- Content Security Policy
- XSS Protection
- Rate Limiting Headers
- HSTS (HTTP Strict Transport Security)

## 3. API Documentation

- OpenAPI/Swagger documentation available at `/api/docs`
- Interactive documentation with try-it-now functionality
- Code examples in multiple languages
- Authentication examples included
