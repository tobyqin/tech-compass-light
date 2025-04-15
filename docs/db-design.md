# Database Design Document

## Overview

This document details the MongoDB collections and their schemas for the Tech Compass platform. All collections use MongoDB's default `_id` field as the primary key.

## Audit Fields

All collections include the following audit fields for tracking purposes:

| Field      | Type     | Description                        |
| ---------- | -------- | ---------------------------------- |
| \_id       | ObjectId | Unique identifier                  |
| created_at | DateTime | When the record was created        |
| created_by | String   | Username of who created the record |
| updated_at | DateTime | When the record was last updated   |
| updated_by | String   | Username of who last updated       |

## Collections

### 1. Groups Collection

Stores organizational groups for solutions.

| Field       | Type     | Description           | Example                    |
| ----------- | -------- | --------------------- | -------------------------- |
| \_id        | ObjectId | Unique identifier     | "507f1f77bcf86cd799439018" |
| name        | String   | Group name            | "Frontend Team"            |
| description | String   | Group description     | "Web frontend developers"  |
| order       | Number   | Order for sorting     | 1                          |
| created_at  | DateTime | Creation timestamp    | "2024-03-15T10:30:00Z"     |
| created_by  | String   | Username of creator   | "admin"                    |
| updated_at  | DateTime | Last update timestamp | "2024-03-16T14:20:00Z"     |
| updated_by  | String   | Username of updater   | "admin"                    |

### 2. Categories Collection

Stores solution categories.

| Field          | Type     | Description                            | Example                              |
| -------------- | -------- | -------------------------------------- | ------------------------------------ |
| \_id           | ObjectId | Unique identifier                      | "507f1f77bcf86cd799439015"           |
| name           | String   | Category name                          | "Development Tools"                  |
| description    | String   | Category description                   | "Tools used in software development" |
| radar_quadrant | Number   | Quadrant position for tech radar (0-3) | 2                                    |
| order          | Number   | Order for sorting categories           | 1                                    |
| created_at     | DateTime | Creation timestamp                     | "2024-03-15T10:30:00Z"               |
| created_by     | String   | Username of creator                    | "admin"                              |
| updated_at     | DateTime | Last update time                       | "2024-03-16T14:20:00Z"               |
| updated_by     | String   | Username of updater                    | "admin"                              |

### 3. Tags Collection

Stores tags for categorizing solutions.

| Field       | Type     | Description            | Example                                     |
| ----------- | -------- | ---------------------- | ------------------------------------------- |
| \_id        | ObjectId | Unique identifier      | "507f1f77bcf86cd799439013"                  |
| name        | String   | Tag name               | "containerization"                          |
| description | String   | Tag description        | "Technologies related to container systems" |
| color       | String   | Color code for the tag | "#FF5733"                                   |
| created_at  | DateTime | Creation timestamp     | "2024-03-15T10:30:00Z"                      |
| created_by  | String   | Username of creator    | "admin"                                     |
| updated_at  | DateTime | Last update time       | "2024-03-16T14:20:00Z"                      |
| updated_by  | String   | Username of updater    | "admin"                                     |

### 4. Solutions Collection

Stores the main technical solution information.

| Field               | Type          | Description                                                             | Example                                                                      |
| ------------------- | ------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| \_id                | ObjectId      | Unique identifier                                                       | "507f1f77bcf86cd799439011"                                                   |
| name                | String        | Solution name                                                           | "Docker"                                                                     |
| slug                | String        | Unique, human-readable identifier (auto-generated)                      | "docker"                                                                     |
| description         | String        | Detailed description, markdown supported                                | "Docker is a platform for developing, shipping, and running applications..." |
| brief               | String        | Brief description (max 200 chars)                                       | "Enterprise container platform for application deployment"                   |
| how_to_use          | String        | Instructions on how to use the solution, markdown supported             | "## Getting Started\n1. Install Docker..."                                   |
| faq                 | String        | Frequently asked questions, markdown supported                          | "## Common Issues\n\*\*Q: How do I..."                                       |
| about               | String        | Additional information, markdown supported                              | "Docker was first released in 2013..."                                       |
| logo                | String        | Logo asset name or path                                                 | "/assets/logos/docker.png"                                                   |
| category            | String        | Primary category                                                        | "Container Platform"                                                         |
| group               | String        | Group identifier for organizing solutions                               | "Default"                                                                    |
| department          | String        | Department name                                                         | "Engineering"                                                                |
| team                | String        | Team name                                                               | "Cloud Infrastructure"                                                       |
| team_email          | String        | Team contact email                                                      | "cloud-infra@company.com"                                                    |
| maintainer          | String        | Username of the maintainer                                              | "johndoe"                                                                    |
| maintainer_name     | String        | Name of the maintainer                                                  | "John Doe"                                                                   |
| maintainer_email    | String        | Email of the maintainer                                                 | "john.doe@company.com"                                                       |
| official_website    | String        | Official website URL                                                    | "https://www.docker.com"                                                     |
| documentation_url   | String        | Documentation URL                                                       | "https://docs.docker.com"                                                    |
| demo_url            | String        | Demo/POC URL                                                            | "https://demo.docker.company.com"                                            |
| support_url         | String        | Support page URL                                                        | "https://support.docker.com"                                                 |
| vendor_product_url  | String        | Vendor product website URL                                              | "https://www.docker.com/products"                                            |
| version             | String        | Current version                                                         | "24.0.7"                                                                     |
| upskilling          | String        | Information on skills development, markdown supported                   | "## Training Resources\n- [Docker Tutorial](https://...)"                    |
| provider_type       | String        | Provider of the solution (VENDOR/INTERNAL)                              | "VENDOR"                                                                     |
| adoption_level      | String        | Current adoption level (PILOT/TEAM/DEPARTMENT/ENTERPRISE/INDUSTRY)      | "ENTERPRISE"                                                                 |
| adoption_complexity | String        | Complexity of adoption (AUTOMATED/EASY/SUPPORT_REQUIRED)                | "EASY"                                                                       |
| adoption_user_count | Number        | Number of users currently using this solution                           | 120                                                                          |
| tags                | Array[String] | List of tag names                                                       | ["container", "devops", "microservices"]                                     |
| pros                | Array[String] | List of advantages                                                      | ["Easy to deploy", "Good documentation"]                                     |
| cons                | Array[String] | List of disadvantages                                                   | ["Resource overhead", "Learning curve"]                                      |
| stage               | String        | Development stage status (DEVELOPING/UAT/PRODUCTION/DEPRECATED/RETIRED) | "PRODUCTION"                                                                 |
| recommend_status    | String        | Strategic recommendation (ADOPT/TRIAL/ASSESS/HOLD)                      | "ADOPT"                                                                      |
| review_status       | String        | Review status (PENDING/APPROVED/REJECTED)                               | "APPROVED"                                                                   |
| created_at          | DateTime      | Creation timestamp                                                      | "2024-03-15T10:30:00Z"                                                       |
| created_by          | String        | Username of creator                                                     | "admin"                                                                      |
| updated_at          | DateTime      | Last update timestamp                                                   | "2024-03-16T14:20:00Z"                                                       |
| updated_by          | String        | Username of last updater                                                | "johndoe"                                                                    |

### 5. History Collection

Stores history of changes to objects.

| Field          | Type          | Description                           | Example                                                                 |
| -------------- | ------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| \_id           | ObjectId      | Unique identifier                     | "507f1f77bcf86cd799439019"                                              |
| object_type    | String        | Type of object changed                | "solution"                                                              |
| object_id      | String        | ID of the object changed              | "507f1f77bcf86cd799439011"                                              |
| object_name    | String        | Name of the object changed            | "Docker"                                                                |
| change_type    | String        | Type of change (create/update/delete) | "update"                                                                |
| changed_fields | Array[Object] | List of fields that were changed      | [{"field_name": "description", "old_value": "...", "new_value": "..."}] |
| change_summary | String        | Summary of changes made               | "Updated description and version"                                       |
| created_at     | DateTime      | Creation timestamp                    | "2024-03-15T10:30:00Z"                                                  |
| created_by     | String        | Username of creator                   | "johndoe"                                                               |
| updated_at     | DateTime      | Last update timestamp                 | "2024-03-15T10:30:00Z"                                                  |
| updated_by     | String        | Username of updater                   | "johndoe"                                                               |

### 6. Comments Collection

Stores user comments on solutions.

| Field           | Type     | Description                      | Example                           |
| --------------- | -------- | -------------------------------- | --------------------------------- |
| \_id            | ObjectId | Unique identifier                | "507f1f77bcf86cd799439017"        |
| object_type     | String   | Type of commented object         | "solution"                        |
| object_id       | String   | ID of the commented object       | "507f1f77bcf86cd799439011"        |
| content         | String   | Comment text                     | "Great tool for containerization" |
| parent_id       | String   | ID of parent comment for replies | null                              |
| adoption_status | String   | User's adoption status           | "CURRENT_USER"                    |
| created_at      | DateTime | Creation timestamp               | "2024-03-15T10:30:00Z"            |
| updated_at      | DateTime | Last update timestamp            | "2024-03-15T10:30:00Z"            |
| created_by      | String   | Username of commenter            | "johndoe"                         |
| updated_by      | String   | Username of updater              | "johndoe"                         |

### 7. Ratings Collection

Stores user ratings for solutions.

| Field           | Type     | Description            | Example                    |
| --------------- | -------- | ---------------------- | -------------------------- |
| \_id            | ObjectId | Unique identifier      | "507f1f77bcf86cd799439016" |
| object_type     | String   | Type of rated object   | "solution"                 |
| object_id       | String   | ID of the rated object | "507f1f77bcf86cd799439011" |
| rating          | Number   | Rating score (1-5)     | 4                          |
| adoption_status | String   | User's adoption status | "CURRENT_USER"             |
| created_at      | DateTime | Creation timestamp     | "2024-03-15T10:30:00Z"     |
| created_by      | String   | Username of rater      | "johndoe"                  |
| updated_at      | DateTime | Last update timestamp  | "2024-03-16T14:20:00Z"     |
| updated_by      | String   | Username of updater    | "johndoe"                  |

### 8. Users Collection

Stores user information.

| Field         | Type     | Description           | Example                    |
| ------------- | -------- | --------------------- | -------------------------- |
| \_id          | ObjectId | Unique identifier     | "507f1f77bcf86cd799439012" |
| username      | String   | Username              | "johndoe"                  |
| email         | String   | Email address         | "john@example.com"         |
| password_hash | String   | Hashed password       | "hash_value_here"          |
| full_name     | String   | User's full name      | "John Doe"                 |
| is_active     | Boolean  | Account status        | true                       |
| is_superuser  | Boolean  | Admin privileges      | false                      |
| created_at    | DateTime | Creation timestamp    | "2024-03-15T10:30:00Z"     |
| updated_at    | DateTime | Last update timestamp | "2024-03-16T14:20:00Z"     |
| created_by    | String   | Username of creator   | "admin"                    |
| updated_by    | String   | Username of updater   | "admin"                    |

### 9. Site Configurations Collection

Stores site-wide configuration settings.

| Field       | Type     | Description                          | Example                            |
| ----------- | -------- | ------------------------------------ | ---------------------------------- |
| \_id        | ObjectId | Unique identifier                    | "507f1f77bcf86cd799439011"         |
| key         | String   | Configuration key                    | "site.name"                        |
| value       | Object   | Configuration value as JSON          | { "name": "Tech Compass Library" } |
| active      | Boolean  | Whether this configuration is active | true                               |
| description | String   | Configuration description            | "Site name configuration"          |
| created_at  | DateTime | Creation timestamp                   | "2024-03-15T10:30:00Z"             |
| created_by  | String   | Username of creator                  | "admin"                            |
| updated_at  | DateTime | Last update timestamp                | "2024-03-16T14:20:00Z"             |
| updated_by  | String   | Username of updater                  | "admin"                            |

## Indexes

### Required Indexes

1. Groups Collection:

   - name (unique)
   - order

2. Categories Collection:

   - name (unique)
   - radar_quadrant

3. Tags Collection:

   - name (unique)

4. Solutions Collection:

   - name (unique)
   - slug (unique)
   - category
   - group
   - department
   - team
   - maintainer
   - stage
   - recommend_status
   - review_status
   - created_at
   - tags

5. History Collection:

   - object_type
   - object_id
   - change_type
   - created_by
   - created_at
   - Compound index: [object_type, object_id]

6. Comments Collection:

   - object_type
   - object_id
   - parent_id
   - created_by
   - created_at

7. Ratings Collection:

   - object_type
   - object_id
   - created_by
   - Compound index: [object_type, object_id, created_by] (unique)

8. Users Collection:

   - username (unique)
   - email (unique)

9. Site Configurations Collection:
   - key (unique)
   - key + active (for quick lookup of active configs)

## Enums and Constants

### Stage Values

- `DEVELOPING` - Solution is under active development
- `UAT` - User Acceptance Testing
- `PRODUCTION` - Actively used in production
- `DEPRECATED` - No longer recommended for new projects
- `RETIRED` - Completely phased out

### Recommend Status Values

- `ADOPT` - Proven technology, safe to use
- `TRIAL` - Worth pursuing, understand how it fits
- `ASSESS` - Worth exploring with the goal of understanding how it will affect your enterprise
- `HOLD` - Proceed with caution

### Adoption Level Values

- `PILOT` - Pilot phase or proof of concept
- `TEAM` - Used by single team
- `DEPARTMENT` - Used across department
- `ENTERPRISE` - Used across enterprise
- `INDUSTRY` - Industry standard

### Adoption Complexity Values

- `AUTOMATED` - Solution can be adopted with automated processes without human intervention
- `EASY` - Simple adoption requiring minimal manual effort
- `SUPPORT_REQUIRED` - Adoption requires technical support or significant manual effort

### Provider Type Values

- `VENDOR` - Solution provided by an external vendor
- `INTERNAL` - Solution developed internally

### Review Status Values

- `PENDING` - Awaiting review
- `APPROVED` - Approved by admin
- `REJECTED` - Rejected by admin

### Change Type Values

- `CREATE` - Object creation
- `UPDATE` - Object update
- `DELETE` - Object deletion
