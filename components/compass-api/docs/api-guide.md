# Tech Compass API Guide

This document provides a comprehensive guide to the Tech Compass API endpoints.

## Base URL

```
http://localhost:8000/api
```

## Response Format

Most endpoints return responses in the following standardized format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "total": 0, // For paginated responses
  "skip": 0, // For paginated responses
  "limit": 0 // For paginated responses
}
```

## Authentication

### Login

```http
POST /auth/login
```

Authenticate a user and receive an access token.

**Request Body (Form):**

```
username=string&password=string
```

**Response:**

```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### Using Authentication

Include the access token in the Authorization header for protected endpoints:

```
Authorization: Bearer {access_token}
```

## Users

### Get Current User

```http
GET /users/me
```

Get information about the current authenticated user.

### Get User by Username

```http
GET /users/{username}
```

Get information about a specific user by username.

### List Users

```http
GET /users
```

Get a paginated list of all users.

**Query Parameters:**

- `skip` (integer, default: 0): Number of items to skip
- `limit` (integer, default: 10): Maximum items to return

### Create User

```http
POST /users
```

Create a new user (admin only).

**Request Body:**

```json
{
  "username": "string",
  "email": "string",
  "full_name": "string",
  "password": "string",
  "is_active": true,
  "is_superuser": false
}
```

### Update User's Own Information

```http
PUT /users/{username}
```

Update the current user's own information.

**Request Body:**

```json
{
  "email": "string",
  "full_name": "string"
}
```

### Update User Password

```http
PUT /users/{username}/password
```

Update the current user's password.

**Request Body:**

```json
{
  "current_password": "string",
  "new_password": "string"
}
```

### Admin: Update User

```http
PUT /users/manage/{username}
```

Admin can update any user's information.

**Request Body:**

```json
{
  "email": "string",
  "full_name": "string",
  "is_active": true,
  "is_superuser": false,
  "password": "string"
}
```

### Admin: Delete User

```http
DELETE /users/manage/{username}
```

Delete a user (admin only).

## Solutions

### List Solutions

```http
GET /solutions
```

Get a paginated list of solutions with optional filtering.

**Query Parameters:**

- `skip` (integer, default: 0): Number of items to skip
- `limit` (integer, default: 10): Maximum items to return
- `category` (string, optional): Filter by category
- `department` (string, optional): Filter by department
- `team` (string, optional): Filter by team
- `recommend_status` (string, optional): Filter by recommendation status (ADOPT/TRIAL/ASSESS/HOLD)
- `stage` (string, optional): Filter by stage (DEVELOPING/UAT/PRODUCTION/DEPRECATED/RETIRED)
- `review_status` (string, optional): Filter by review status (PENDING/APPROVED/REJECTED)
- `tags` (string, optional): Filter by tags (comma-separated)
- `sort` (string, default: "name"): Sort field (prefix with - for descending order)

### Get My Solutions

```http
GET /solutions/my
```

Get solutions created by or maintained by the current user.

**Query Parameters:**

- `skip` (integer, default: 0): Number of items to skip
- `limit` (integer, default: 10): Maximum items to return
- `sort` (string, default: "name"): Sort field (prefix with - for descending order)

### Search Solutions

```http
GET /solutions/search
```

Search solutions by keyword across multiple fields.

**Query Parameters:**

- `keyword` (string, required): Search keyword

### Get Solution by Slug

```http
GET /solutions/{slug}
```

Get detailed information about a specific solution.

### Create Solution

```http
POST /solutions
```

Create a new solution. Requires authentication.

**Request Body:**

```json
{
  "name": "string",
  "brief": "string",
  "description": "string",
  "category": "string",
  "department": "string",
  "team": "string",
  "maintainer": "string",
  "pros": ["string"],
  "cons": ["string"],
  "recommend_status": "string",
  "stage": "string",
  "review_status": "string",
  "docs_url": "string",
  "source_code_url": "string",
  "tags": ["string"]
}
```

### Update Solution

```http
PUT /solutions/{slug}
```

Update an existing solution. Requires authentication.

### Delete Solution

```http
DELETE /solutions/{slug}
```

Delete a solution. Creator, maintainer, or admin only.

### Check Solution Name Exists

```http
GET /solutions/check-name/{name}
```

Check if a solution name already exists.

### Get Solution History

```http
GET /solutions/{slug}/history
```

Get the change history for a specific solution.

### Get Departments

```http
GET /solutions/departments
```

Get a list of all unique department names from solutions.

## Categories

### List Categories

```http
GET /categories
```

Get a list of all categories.

**Query Parameters:**

- `skip` (integer, default: 0): Number of items to skip
- `limit` (integer, default: 100): Maximum items to return
- `sort` (string, optional): Sort field (prefix with - for descending order)

### Get Category

```http
GET /categories/{category_id}
```

Get a specific category by ID.

### Create Category

```http
POST /categories
```

Create a new category (admin only).

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "radar_quadrant": 0,
  "order": 0
}
```

### Update Category

```http
PUT /categories/{category_id}
```

Update a category (admin only).

### Delete Category

```http
DELETE /categories/{category_id}
```

Delete a category (admin only). Category must not be in use by any solutions.

## Tags

### List Tags

```http
GET /tags
```

Get a list of all tags.

**Query Parameters:**

- `skip` (integer, default: 0): Number of items to skip
- `limit` (integer, default: 100): Maximum items to return

### Get Tag

```http
GET /tags/{tag_name}
```

Get a specific tag by name.

### Create Tag

```http
POST /tags
```

Create a new tag (admin only).

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "color": "string"
}
```

### Update Tag

```http
PUT /tags/{tag_name}
```

Update a tag (admin only).

### Delete Tag

```http
DELETE /tags/{tag_name}
```

Delete a tag (admin only).

### Search Tags

```http
GET /tags/search
```

Search for tags.

**Query Parameters:**

- `q` (string, required): Search query

## Comments

### Get Comments for a Solution

```http
GET /comments/solution/{solution_id}
```

Get all comments for a specific solution.

### Create Comment

```http
POST /comments
```

Create a new comment.

**Request Body:**

```json
{
  "object_type": "string",
  "object_id": "string",
  "content": "string",
  "adoption_status": "string",
  "parent_id": "string"
}
```

### Update Comment

```http
PUT /comments/{comment_id}
```

Update a comment. Only the comment author can update it.

**Request Body:**

```json
{
  "content": "string"
}
```

### Delete Comment

```http
DELETE /comments/{comment_id}
```

Delete a comment. Only the comment author or admin can delete it.

### Get Comment Statistics

```http
GET /comments/stats/solution/{solution_id}
```

Get comment statistics for a solution.

## Ratings

### Get Ratings for a Solution

```http
GET /ratings/solution/{solution_id}
```

Get all ratings for a specific solution.

### Get Aggregate Ratings

```http
GET /ratings/solution/{solution_id}/aggregate
```

Get aggregate rating statistics for a solution.

### Create/Update Rating

```http
POST /ratings
```

Create or update a rating.

**Request Body:**

```json
{
  "object_type": "string",
  "object_id": "string",
  "rating": 0,
  "adoption_status": "string"
}
```

### Delete Rating

```http
DELETE /ratings/solution/{solution_id}/user/{username}
```

Delete a rating.

### Get My Ratings

```http
GET /ratings/my
```

Get all ratings by the current user.

## Groups

### List Groups

```http
GET /groups
```

Get a list of all groups.

**Query Parameters:**

- `skip` (integer, default: 0): Number of items to skip
- `limit` (integer, default: 100): Maximum items to return
- `sort` (string, default: "order"): Sort field (prefix with - for descending order)

### Get Group

```http
GET /groups/{group_id}
```

Get a specific group by ID.

### Create Group

```http
POST /groups
```

Create a new group (admin only).

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "order": 0
}
```

### Update Group

```http
PUT /groups/{group_id}
```

Update a group (admin only).

### Delete Group

```http
DELETE /groups/{group_id}
```

Delete a group (admin only).

## Tech Radar

### Get Tech Radar Data

```http
GET /tech-radar/data
```

Get tech radar data in Zalando Tech Radar format.

**Query Parameters:**

- `group` (string, optional): Filter solutions by group

### Get Radar Quadrants

```http
GET /tech-radar/quadrants
```

Get radar quadrants ordered by their radar_quadrant value.

### Get Radar Rings

```http
GET /tech-radar/rings
```

Get radar rings in order (ADOPT, TRIAL, ASSESS, HOLD).

## Site Configuration

### Get All Site Configs

```http
GET /site-config
```

Get all site configurations. Requires authentication.

### Get Site Config by Key

```http
GET /site-config/{key}
```

Get site configurations by key. Public endpoint.

**Query Parameters:**

- `active` (boolean, default: false): Filter by active status

### Create Site Config

```http
POST /site-config
```

Create a new site configuration. Requires authentication.

**Request Body:**

```json
{
  "key": "string",
  "value": "string",
  "active": true
}
```

### Update Site Config

```http
PUT /site-config/{id}
```

Update a site configuration. Requires authentication.

### Delete Site Config

```http
DELETE /site-config/{id}
```

Delete a site configuration (admin only).

### Reset Site Configs

```http
POST /site-config/reset
```

Reset all site configurations to defaults (admin only).

## History

### Get History Records

```http
GET /history
```

Get history records with optional filtering.

**Query Parameters:**

- `object_type` (string, optional): Filter by object type (e.g., 'solution', 'category')
- `object_id` (string, optional): Filter by object ID
- `object_name` (string, optional): Filter by object name (case-insensitive, partial match)
- `change_type` (string, optional): Filter by change type (create/update/delete)
- `username` (string, optional): Filter by username who made the change
- `start_date` (string, optional): Filter changes after this date (ISO format)
- `end_date` (string, optional): Filter changes before this date (ISO format)
- `skip` (integer, default: 0): Number of records to skip
- `limit` (integer, default: 20): Maximum records to return

## HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content to return
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
