# Business Management System

An advanced system for managing business profiles, files, appointments, and performance metrics across different business types (restaurant, retail, and service).

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Docker Setup](#docker-setup)
  - [Environment Configuration](#environment-configuration)
- [Development Workflow](#development-workflow)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

This application provides a comprehensive system for businesses to manage their profiles, files, appointments, and track performance metrics. The system supports different business types (restaurant, retail, service) with type-specific features and management capabilities.

### Key Features

- Multi-tenant business management
- Type-specific business details (restaurant, retail, service)
- Appointment scheduling and management
- File storage and management
- Performance analytics and reporting
- User authentication and access control

## Architecture

The application follows a layered architecture:

1. **Presentation Layer**:
   - React components and UI
   - Pages and routing

2. **Business Logic Layer**:
   - Services
   - Factories
   - Utility classes

3. **Data Access Layer**:
   - Repositories
   - Database interactions
   - External API integrations

4. **Infrastructure**:
   - Database (PostgreSQL via Supabase)
   - File Storage (Supabase Storage)
   - Authentication (Supabase Auth)

## Project Structure

```
/
├── app/                        # Next.js application routes
├── components/                 # Reusable React components
│   ├── providers/              # Context providers (Auth, Supabase, Services)
│   └── ui/                     # UI components
├── lib/                        # Core application code
│   ├── database/               # Database related code
│   │   ├── interfaces/         # Repository interfaces
│   │   ├── repositories/       # Repository implementations
│   │   └── types/              # Database types
│   ├── services/               # Business logic services
│   │   ├── appointment/        # Appointment service
│   │   ├── business/           # Business services
│   │   ├── file/               # File service
│   │   └── performance/        # Performance metrics services
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── .env.example                # Example environment variables
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose configuration
└── package.json                # Project dependencies and scripts
```

## Setup and Installation

### Prerequisites

- Node.js (16.x or later)
- Docker and Docker Compose
- Supabase account

### Docker Setup

#### Development Environment

```bash
# Build the Docker image with no cache (for clean build)
docker build --no-cache -t aira-platformauth .

# Run the container, mapping port 3000
docker run -p 3000:3000 aira-platformauth

# Alternative options using docker-compose
# Build the Docker images
docker-compose build

# Start the application and associated services
docker-compose up

# Run in detached mode
docker-compose up -d

# Stop the containers
docker-compose down

# View logs
docker-compose logs -f
```

#### Production Environment

```bash
# Build and run production containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale the app as needed
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale app=3
```

### Environment Configuration

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Update the environment variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Settings
NEXT_PUBLIC_APP_URL=https://aira.aivn.ai
```

## Development Workflow

### Starting the Development Server

```bash
# Using Docker
docker-compose up

# Direct development (without Docker)
npm install
npm run dev
```

### Database Migrations

Database migrations are managed through Supabase. For local development, you can use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase instance
supabase start

# Apply migrations
supabase db migrate

# Generate new migration
supabase db new migration_name
```

## API Documentation

The application provides RESTful APIs for interacting with the system. Key endpoints include:

- `/api/businesses` - Business management
- `/api/appointments` - Appointment scheduling
- `/api/files` - File management
- `/api/performance` - Performance metrics

For detailed API documentation, refer to the API documentation in the `/docs` directory or use the Swagger UI at `/api/docs` when running the application.

## Testing

### Running Tests

```bash
# Run all tests
docker-compose run app npm test

# Run specific tests
docker-compose run app npm test -- -t "business service"

# Run tests with coverage
docker-compose run app npm run test:coverage
```

### Test Structure

- Unit tests: `/lib/**/*.test.ts`
- Integration tests: `/tests/integration/**/*.test.ts`
- End-to-end tests: `/tests/e2e/**/*.test.ts`

## Deployment

### Deploying with Docker

```bash
# Build production image with no cache
docker build --no-cache -t aira-platformauth .

# Run production container
docker run -p 3000:3000 aira-platformauth

# Alternative approach with named image
docker build -t business-management-system:latest .
docker run -p 3000:3000 --env-file .env.production business-management-system:latest
```

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

1. Pushing to `main` triggers tests
2. Creating a release tag deploys to staging
3. Promoting a release deploys to production

## Troubleshooting

### Common Issues

#### Docker Container Fails to Start

```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config

# Rebuild container
docker-compose build --no-cache app
docker-compose up -d
```

#### Database Connection Issues

1. Verify Supabase credentials in `.env.local`
2. Check network connectivity
3. Ensure database schema is up to date

#### File Upload Problems

1. Check storage bucket configuration
2. Verify file size limits
3. Examine browser console for CORS issues

## Contributing

### Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m "Add feature"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Write unit tests for new functionality
- Document public APIs
- Follow the existing architecture pattern

## License

[Specify your license here]