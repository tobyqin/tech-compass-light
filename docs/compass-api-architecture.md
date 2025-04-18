# Tech Compass API Architecture Diagrams

This document provides various architectural views of the Tech Compass API system using component diagrams based on the actual codebase.

## 1. High-Level System Architecture

```mermaid
graph TD
    Client["Client Applications"] --> API["Tech Compass API"]

    subgraph "Tech Compass API"
        FastAPI["FastAPI Framework"] --> Routers["API Routers"]
        Routers --> Services["Business Services"]
        Services --> Models["Data Models"]
        Models --> Database["MongoDB"]

        FastAPI --> Middleware["Middleware (CORS, Auth)"]
        FastAPI --> Core["Core Components"]
    end

    subgraph "Core Components"
        Auth["Authentication"]
        Config["Configuration"]
        Security["Security"]
        MongoDB["Database Connection"]
        Password["Password Utilities"]
    end

    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style API fill:#bbf,stroke:#333,stroke-width:2px
    style FastAPI fill:#ddf,stroke:#333,stroke-width:2px
    style Database fill:#fdd,stroke:#333,stroke-width:2px
```

This diagram shows the high-level system architecture of the Tech Compass API, including the major components and their relationships.

## 2. Component Interaction Diagram

```mermaid
flowchart TD
    subgraph Client["Client"]
        WebUI["Web UI"]
        MobileApp["Mobile App"]
    end

    subgraph TechCompassAPI["Tech Compass API"]
        FastAPI["FastAPI App"]
        CORS["CORS Middleware"]

        subgraph Routers["API Routers"]
            AuthRouter["Auth Router"]
            SolutionsRouter["Solutions Router"]
            UsersRouter["Users Router"]
            TagsRouter["Tags Router"]
            RatingsRouter["Ratings Router"]
            CommentsRouter["Comments Router"]
            CategoriesRouter["Categories Router"]
            GroupsRouter["Groups Router"]
            AssetsRouter["Assets Router"]
            TechRadarRouter["Tech Radar Router"]
            HistoryRouter["History Router"]
            SiteConfigRouter["Site Config Router"]
        end

        subgraph Services["Services"]
            UserService["User Service"]
            SolutionService["Solution Service"]
            TagService["Tag Service"]
            RatingService["Rating Service"]
            CommentService["Comment Service"]
            CategoryService["Category Service"]
            AssetService["Asset Service"]
            TechRadarService["Tech Radar Service"]
            GroupService["Group Service"]
            HistoryService["History Service"]
            SiteConfigService["Site Config Service"]
        end

        subgraph Core["Core Components"]
            Security["Security"]
            Auth["Auth"]
            Config["Config"]
            MongoDBConnection["MongoDB Connection"]
            Password["Password Utilities"]
        end

        subgraph Models["Data Models"]
            CommonModels["Common Models"]
            SolutionModel["Solution Models"]
            UserModel["User Models"]
            TagModel["Tag Models"]
            CategoryModel["Category Models"]
            CommentModel["Comment Models"]
            RatingModel["Rating Models"]
            ResponseModel["Response Models"]
        end
    end

    subgraph Database["Database"]
        MongoDB[(MongoDB)]
    end

    WebUI --> FastAPI
    MobileApp --> FastAPI
    FastAPI --> CORS
    CORS --> Routers

    AuthRouter --> Security
    AuthRouter --> UserService
    UsersRouter --> UserService
    SolutionsRouter --> SolutionService
    TagsRouter --> TagService
    RatingsRouter --> RatingService
    CommentsRouter --> CommentService
    CategoriesRouter --> CategoryService
    GroupsRouter --> GroupService
    AssetsRouter --> AssetService
    TechRadarRouter --> TechRadarService
    HistoryRouter --> HistoryService
    SiteConfigRouter --> SiteConfigService

    UserService --> UserModel
    SolutionService --> SolutionModel
    TagService --> TagModel
    RatingService --> RatingModel
    CommentService --> CommentModel
    CategoryService --> CategoryModel

    UserService --> MongoDBConnection
    SolutionService --> MongoDBConnection
    TagService --> MongoDBConnection
    RatingService --> MongoDBConnection
    CommentService --> MongoDBConnection
    CategoryService --> MongoDBConnection
    AssetService --> MongoDBConnection
    TechRadarService --> MongoDBConnection
    GroupService --> MongoDBConnection
    HistoryService --> MongoDBConnection
    SiteConfigService --> MongoDBConnection

    MongoDBConnection --> MongoDB

    Security --> Auth
    Auth --> UserService
    Security --> Password

    Auth --> Config
    MongoDBConnection --> Config
```

This diagram illustrates the detailed component interactions within the Tech Compass API, showing how different routers, services, and models interact with each other and the database.

## 3. Model Relationships

```mermaid
classDiagram
    class AuditModel {
        +PyObjectId id
        +datetime created_at
        +str created_by
        +datetime updated_at
        +str updated_by
    }

    class User {
        +str username
        +str email
        +str full_name
        +bool is_active
        +bool is_superuser
    }

    class UserInDB {
        +str hashed_password
    }

    class Solution {
        +str name
        +str slug
        +str description
        +str brief
        +str category
        +str department
        +str team
        +str maintainer_id
        +List~str~ tags
        +StageEnum stage
        +RecommendStatusEnum recommend_status
        +ReviewStatusEnum review_status
        +float rating
        +int rating_count
    }

    class Tag {
        +str name
        +str description
        +int usage_count
    }

    class Category {
        +str name
        +str description
        +str group
        +int solution_count
    }

    class Rating {
        +str solution_id
        +str user_id
        +int score
        +str comment
    }

    class Comment {
        +str solution_id
        +str user_id
        +str text
    }

    class TechRadar {
        +str name
        +str description
        +List~str~ quadrants
        +List~str~ rings
    }

    AuditModel <|-- User
    AuditModel <|-- Solution
    AuditModel <|-- Tag
    AuditModel <|-- Category
    AuditModel <|-- Rating
    AuditModel <|-- Comment
    AuditModel <|-- TechRadar

    User <|-- UserInDB
    Solution "1" --> "*" Tag : has
    Solution "1" --> "*" Rating : has
    Solution "1" --> "*" Comment : has
    Solution "*" --> "1" Category : belongs to
    User "1" --> "*" Rating : creates
    User "1" --> "*" Comment : posts
    User "1" --> "*" Solution : maintains
```

This class diagram shows the data model relationships in the Tech Compass API, focusing on the inheritance from the AuditModel base class and the associations between various entities.

## 4. API Data Flow

```mermaid
flowchart TD
    Client([Client]) -->|HTTP Request| API[API Endpoints]

    subgraph "API Processing"
        API -->|Auth Token Check| OAuth2Security[OAuth2 Security]
        OAuth2Security -->|JWT Validation| Auth[Auth Core]
        Auth -->|User Verification| UserService[User Service]
        API -->|Route Request| Routers[API Routers]
        Routers -->|Process Request| Services[Service Layer]
        Services -->|Data Operations| Models[Data Models]
        Models -->|MongoDB Operations| Database[(MongoDB)]
        Database -->|Query Results| Models
        Models -->|Processed Data| Services
        Services -->|Response Data| Routers
        Routers -->|Format Response| API
    end

    API -->|HTTP Response| Client

    subgraph "Authentication Flow"
        ClientAuth([Client]) -->|Credentials| AuthRouter[/Auth Router/]
        AuthRouter -->|Verify Credentials| Security[Security]
        Security -->|Check External Auth| ExternalAuth{External Auth?}

        ExternalAuth -->|Yes| ExternalServer[External Auth Server]
        ExternalAuth -->|No| LocalAuth[Local Password Check]
        LocalAuth -->|Verify Password| UserService
        ExternalServer -->|User Data| Security

        Security -->|Generate JWT| AuthRouter
        AuthRouter -->|Return Token| ClientAuth
    end
```

This diagram illustrates the flow of data through the API, including the authentication process with support for both local authentication and external authentication servers.

## 5. Deployment Architecture

```mermaid
flowchart TD
    subgraph "Client Tier"
        WebApp["Web Application"]
        MobileApp["Mobile Application"]
    end

    subgraph "Application Tier"
        APIServer["FastAPI Application Server"]
        subgraph "Tech Compass API"
            Endpoints["API Endpoints"]
            BusinessLogic["Business Logic"]
            DataAccess["Data Access Layer"]
        end
    end

    subgraph "Database Tier"
        MongoDB[(MongoDB Database)]
    end

    subgraph "External Services"
        ExternalAuth["External Auth Server (Optional)"]
        AvatarService["Avatar Service (Optional)"]
    end

    WebApp --> APIServer
    MobileApp --> APIServer
    APIServer --> Endpoints
    Endpoints --> BusinessLogic
    BusinessLogic --> DataAccess
    DataAccess --> MongoDB
    BusinessLogic -.-> ExternalAuth
    BusinessLogic -.-> AvatarService
```

This diagram shows how the Tech Compass API would be deployed across different tiers in a production environment, including optional external services for authentication and avatars.

## 6. API Resource Relationships

```mermaid
erDiagram
    SOLUTION ||--o{ TAG : has
    SOLUTION ||--o{ RATING : has
    SOLUTION ||--o{ COMMENT : has
    SOLUTION }|--|| CATEGORY : belongs_to
    SOLUTION }|--|| GROUP : belongs_to
    SOLUTION }|--o| USER : maintained_by
    SOLUTION ||--o{ ASSET : has
    USER ||--o{ RATING : creates
    USER ||--o{ COMMENT : posts
    USER ||--o{ SOLUTION : creates
    HISTORY }|--|| SOLUTION : records_changes_to
    TECH_RADAR ||--o{ SOLUTION : includes
    TAG }o--o{ SOLUTION : categorizes
    SITE_CONFIG ||--|| SYSTEM : configures
```

This entity-relationship diagram depicts the relationships between the different resources exposed by the Tech Compass API.

## 7. API Request-Response Cycle

```mermaid
sequenceDiagram
    participant Client
    participant FastAPI
    participant Router
    participant Service
    participant Model
    participant MongoDB

    Client->>FastAPI: HTTP Request
    FastAPI->>FastAPI: CORS Middleware
    FastAPI->>FastAPI: JWT Authentication
    FastAPI->>Router: Route Request
    Router->>Service: Process Request
    Service->>Model: Validate Data
    Service->>MongoDB: Database Query
    MongoDB-->>Service: Query Results
    Service->>Model: Create Response Model
    Service-->>Router: Response Data
    Router-->>FastAPI: Formatted Response
    FastAPI-->>Client: HTTP Response
```

This sequence diagram illustrates the request-response cycle for a typical API call in the Tech Compass system, including middleware processing and authentication.

## 8. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant AuthAPI
    participant Security
    participant UserService
    participant ExternalAuth
    participant MongoDB

    User->>Client: Enter Credentials
    Client->>AuthAPI: POST /api/auth/login
    AuthAPI->>Security: verify_credentials(username, password)

    alt External Auth Enabled
        Security->>ExternalAuth: HTTP Request with Credentials
        ExternalAuth-->>Security: Auth Response

        alt Valid Credentials
            Security->>UserService: Create/Update User
            UserService->>MongoDB: Save User
        end
    else Local Auth
        Security->>UserService: get_user_by_username
        UserService->>MongoDB: Query User
        MongoDB-->>UserService: User Data
        UserService-->>Security: User (with hashed_password)
        Security->>Security: verify_password(password, hashed_password)
    end

    alt Valid User
        Security->>Security: create_access_token(username)
        Security-->>AuthAPI: JWT Token
        AuthAPI-->>Client: Return Token Response
        Client-->>User: Authentication Success
    else Invalid User
        Security-->>AuthAPI: Auth Error
        AuthAPI-->>Client: 401 Unauthorized
        Client-->>User: Authentication Failed
    end

    Note over Client,AuthAPI: For Protected Endpoints
    Client->>FastAPI: Request with JWT in Authorization header
    FastAPI->>Security: validate_token(token)

    alt Valid Token
        Security->>UserService: get_user_from_token
        UserService-->>Security: User Data
        Security-->>FastAPI: Current User
        FastAPI->>FastAPI: Process Request
        FastAPI-->>Client: Response
    else Invalid Token
        Security-->>FastAPI: Auth Error
        FastAPI-->>Client: 401 Unauthorized
    end
```

This detailed sequence diagram shows the authentication flow, including both local and external authentication options, token generation, and validation for protected endpoints.
