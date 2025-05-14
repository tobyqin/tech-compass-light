# Tech Compass: Getting Started

This document answers the five most important questions a developer would need to know when starting to work with the Tech Compass codebase.

## Five Most Important Questions for Developers

### 1. What is the purpose and architecture of Tech Compass?

Tech Compass is a platform for discovering, evaluating, and sharing technology solutions within an organization. It helps teams make informed decisions about technology choices by providing a centralized catalog of solutions with ratings, reviews, and documentation.

The architecture follows a microservices approach with two main components:

- Backend API service built with Python FastAPI and MongoDB
- Frontend web application built with Angular and PrimeNG

### 2. How is data structured and stored in the system?

The system uses MongoDB as its primary database with collections for:

- Solutions (the core entity containing technology details)
- Categories (for organizing solutions)
- Groups (for team organization)
- Tags (for flexible categorization)
- Ratings (user ratings of solutions)
- Comments (user feedback and discussions)
- Users (authentication and permissions)
- History (tracking changes to entities)
- Site Configuration (system-wide settings)

### 3. What are the key API endpoints and how do I interact with them?

The API follows RESTful principles with endpoints organized by resource type.
Key endpoints include:

- `/api/solutions` - CRUD operations for technology solutions
- `/api/categories` - Manage solution categories
- `/api/tags` - Manage tags for solutions
- `/api/ratings` - Rate solutions
- `/api/comments` - Comment on solutions
- `/api/auth` - Authentication and user management

Authentication uses JWT tokens with role-based permissions.

### 4. How does the solution evaluation and recommendation system work?

Solutions have several classification fields:

- Stage (DEVELOPING, UAT, PRODUCTION, DEPRECATED, RETIRED)
- Recommendation Status (ADOPT, TRIAL, ASSESS, HOLD, EXIT)
- Adoption Level (PILOT, TEAM, DEPARTMENT, ENTERPRISE, INDUSTRY)
- Adoption Complexity (AUTOMATED, EASY, SUPPORT_REQUIRED)

Users can rate solutions (1-5 stars) and provide comments. Solutions can be filtered and searched by various criteria. Tech Radar visualization helps categorize solutions by recommendation status.

### 5. How do I set up and run the application locally?

Prerequisites: Node.js 16+, Python 3.11+, MongoDB 5.0+

Backend setup:

```bash
cd components/compass-api
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

python main.py
```

Frontend setup:

```bash
cd components/compass-ui
npm install
ng serve
```

Alternatively, use Docker with:

```bash
docker-compose up -d
```
