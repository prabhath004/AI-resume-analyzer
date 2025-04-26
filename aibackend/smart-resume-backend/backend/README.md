# Smart Resume Screener - Backend

This is the backend service for the Smart Resume Screener platform, built with Spring Boot.

## Prerequisites

- Java 17 or higher
- Maven 3.8 or higher
- PostgreSQL 12 or higher
- Python 3.8 or higher (for AI service)

## Setup

1. Create PostgreSQL database:
```bash
psql -U postgres
\i src/main/resources/db/init.sql
```

2. Configure application properties:
- Copy `src/main/resources/application.properties` to `application-dev.properties`
- Update database credentials and other configurations as needed

3. Build the project:
```bash
mvn clean install
```

4. Run the application:
```bash
mvn spring-boot:run
```

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/signin` - Login user

### Job Descriptions
- POST `/api/jobs` - Create new job description
- GET `/api/jobs` - Get all job descriptions
- GET `/api/jobs/{id}` - Get job description by ID
- PUT `/api/jobs/{id}` - Update job description
- DELETE `/api/jobs/{id}` - Delete job description

### Resumes
- POST `/api/resumes/upload` - Upload and analyze resume
- GET `/api/resumes` - Get all resumes
- GET `/api/resumes/{id}` - Get resume by ID
- DELETE `/api/resumes/{id}` - Delete resume
- GET `/api/resumes/dashboard` - Get dashboard statistics

## Integration with AI Service

The backend integrates with a Python-based AI service for resume analysis. The AI service should be running on `http://localhost:5000` by default. The service endpoint can be configured in `application.properties`.

## Security

The application uses JWT for authentication. The JWT secret and expiration can be configured in `application.properties`.

## File Storage

Uploaded resumes are stored in the `uploads` directory by default. The storage location can be configured in `application.properties`. 