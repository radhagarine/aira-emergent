# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server on port 3000
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Database (Supabase)
- `npm run supabase:start` - Start local Supabase instance
- `npm run supabase:stop` - Stop local Supabase instance
- `npm run supabase:status` - Check Supabase status
- `npm run db:reset` - Reset database to initial state
- `npm run db:push` - Push schema changes to database
- `npm run db:diff` - Show database schema differences

### Testing
- `npm test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:ci` - Run tests for CI/CD
- `npm run test:verbose` - Run tests with verbose output

### Docker Development
- `docker-compose up` - Start application with Docker
- `docker-compose up -d` - Start in detached mode
- `docker-compose down` - Stop containers
- `docker build --no-cache -t aira-platformauth .` - Build fresh Docker image

## Architecture Overview

This is a Next.js 13 business management system built with TypeScript, using the App Router pattern. The application follows a layered architecture with clear separation of concerns.

### Core Architecture Patterns

**Factory Pattern**: The application heavily uses factories for dependency injection:
- `RepositoryFactory` - Creates and manages all database repository instances
- `ServiceFactory` - Creates and manages all service layer instances
- `BusinessServiceFactory` - Creates type-specific business services

**Repository Pattern**: All database operations go through repository interfaces:
- Each entity has its own repository (Business, Appointments, Files, etc.)
- Repositories implement interfaces for easy testing and mocking
- Base repository provides common CRUD operations

**Service Layer**: Business logic is encapsulated in services:
- `BusinessService` - Core business operations
- `AppointmentService` - Appointment scheduling and management
- `FileService` - File upload and management
- Type-specific services: `RestaurantService`, `RetailService`, `ServiceBusinessService`

### Project Structure

```
app/                          # Next.js 13 App Router pages
├── dashboard/               # Main dashboard application
│   ├── analytics/          # Analytics and reporting
│   ├── calendar/           # Appointment calendar views
│   ├── overview/           # Business overview and stats
│   ├── profile/            # Business profile management
│   └── settings/           # Application settings
|   └── numbers/            # Phone Numbers of Busineses
├── auth/                   # Authentication routes
└── globals.css             # Global styles

components/                  # Reusable React components
├── providers/              # React Context providers
│   ├── auth-provider.tsx   # Authentication context
│   ├── supabase-provider.tsx # Supabase client context
│   └── service-provider.tsx # Service layer context
├── ui/                     # Base UI components (shadcn/ui)
└── dashboard/              # Dashboard-specific components

lib/                        # Core application logic
├── database/               # Database layer
│   ├── interfaces/         # Repository interfaces
│   ├── repositories/       # Repository implementations
│   └── repository.factory.ts # Repository factory
├── services/               # Business logic layer
│   ├── business/           # Business management services
│   ├── appointment/        # Appointment services
│   ├── file/              # File management services
│   └── service.factory.ts  # Service factory
└── types/                  # TypeScript type definitions

tests/                      # Test files (Vitest)
├── components/             # Component tests
├── lib/                    # Service and repository tests
└── utils/                  # Test utilities and mocks
```

### Key Technologies

- **Frontend**: Next.js 13 (App Router), React 18, TypeScript
- **UI Components**: Radix UI primitives with shadcn/ui, Tailwind CSS
- **Database**: Supabase (PostgreSQL) with typed client
- **State Management**: Zustand for local state, React Context for services
- **Testing**: Vitest with React Testing Library
- **Styling**: Tailwind CSS with CSS-in-JS support

### Multi-Business Type Support

The application supports three business types with specialized functionality:
- **Restaurant**: Menu management, table reservations, food service features
- **Retail**: Inventory tracking, sales analytics, customer management
- **Service**: Appointment scheduling, service provider management, time tracking

Each business type has:
- Dedicated repository (`RestaurantDetailsRepository`, etc.)
- Type-specific service (`RestaurantService`, etc.)
- Specialized UI components and forms

### Service Provider Architecture

Services are provided to React components via Context:
- `ServiceProvider` - Basic service injection
- `EnhancedServiceProvider` - Includes type-specific services
- Hook-based access: `useBusinessService()`, `useAppointmentService()`, etc.
- Type-specific hooks: `useRestaurantService()`, `useTypeSpecificService()`

### Database Integration

- All database operations use Supabase client with full TypeScript support
- Repository pattern ensures consistent data access
- Automatic type generation from Supabase schema
- Built-in caching and error handling in service layer

### Testing Strategy

- Unit tests for all services and repositories
- Component tests using React Testing Library
- Mock factories for isolated testing
- Test setup includes Supabase mocking and service injection
- Coverage reporting available via Vitest

## Important Development Notes

### Service Dependencies
When creating new features, always go through the service layer rather than directly accessing repositories. Use the `ServiceProvider` to inject services into components.

### Type Safety
The codebase is fully typed. Always use the generated Supabase types and create proper interfaces for new functionality.

### Testing Requirements
All new services and repositories must include comprehensive unit tests. Use the existing mock patterns in `tests/utils/mocks/` for consistency.

### Database Changes
Schema changes should be made through Supabase migrations. Use `npm run db:diff` to generate migration files after making changes in the Supabase dashboard.

### Environment Setup
Copy `.env.example` to `.env.local` and configure Supabase credentials. The application requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at minimum.