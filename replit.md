# Audiometry Results & Billing Sync Portal

## Overview

A healthcare workflow demo application that manages audiometry test results and billing synchronization. This is an admin portal focusing on data management, billing integration with simulated external services, error handling, and retry mechanisms. The application demonstrates robust handling of flaky external APIs with comprehensive audit logging.

The core workflow allows users to:
- Create and view audiometry test results for patients
- Sync results with a mock external billing system (QuickBooks-like)
- View detailed sync history with error categorization
- Retry failed syncs with full audit trail

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Architecture Pattern
**Modular Monolith** - Single backend with clean separation of concerns between services. The application uses a three-layer structure:

1. **Frontend (React SPA)** - Located in `client/src/`
   - Built with Vite and React
   - Uses TanStack Query for server state management
   - Wouter for client-side routing
   - Shadcn/ui component library with Radix primitives
   - Tailwind CSS for styling with medical/professional theme

2. **Backend (Express API)** - Located in `server/`
   - Express 5.x with TypeScript
   - RESTful API endpoints defined in `shared/routes.ts`
   - Storage layer abstraction in `server/storage.ts`
   - Mock external billing service with simulated failures (10% auth, 10% validation, 10% rate limit, 10% network errors)

3. **Shared Layer** - Located in `shared/`
   - Database schema definitions using Drizzle ORM
   - API route contracts with Zod validation
   - Type definitions shared between frontend and backend

### Database Design
Uses PostgreSQL with Drizzle ORM. Two main tables:
- `audiometry_results` - Patient test data with status tracking (NEW/BILLED/FAILED)
- `billing_sync_logs` - Audit trail for sync attempts with error categorization

### API Structure
All endpoints prefixed with `/api/`:
- `GET /api/audiometry` - List all results with last sync log
- `POST /api/audiometry` - Create new result
- `POST /api/audiometry/:id/sync` - Trigger billing sync
- `GET /api/audiometry/:id/logs` - Get sync history

### Build System
- Development: `tsx` for TypeScript execution
- Production: `esbuild` for server bundling, Vite for client build
- Database migrations: `drizzle-kit push`

## External Dependencies

### Database
- **PostgreSQL** - Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM** - Type-safe database queries and schema management
- **connect-pg-simple** - PostgreSQL session store (available but not currently used)

### Mock External Services
- **Mock Billing API** - Simulates QuickBooks-like billing system with configurable failure rates
  - 60% success rate
  - Simulated error types: AUTH, VALIDATION, RATE_LIMIT, NETWORK
  - 800ms artificial latency

### Frontend Libraries
- **TanStack Query** - Server state management and caching
- **Shadcn/ui** - Component library (New York style variant)
- **Radix UI** - Accessible component primitives
- **React Hook Form + Zod** - Form handling with validation
- **date-fns** - Date formatting
- **Lucide React** - Icons

### Development Tools
- **Vite** - Frontend build and dev server
- **tsx** - TypeScript execution for Node.js
- **Replit plugins** - Error overlay, cartographer, dev banner (dev only)