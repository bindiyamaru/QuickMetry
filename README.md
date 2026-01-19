Audiometry Portal
Overview

The Audiometry Portal is a modern web application designed for managing patient hearing test results and automating billing synchronization with QuickBooks Online. This application demonstrates seamless integration between a healthcare workflow system and financial accounting software, enabling efficient end-to-end patient billing processes.

The app provides a user-friendly interface for audiometry technicians to record test results, track billing status, and automatically sync patient data and invoices to QuickBooks, reducing manual data entry and improving billing accuracy.

Core Functionality
- Patient Record Management: Create, view, and manage audiometry test results with patient details
- Real-time Status Tracking: Monitor billing status (NEW, BILLED, FAILED) with visual indicators
- Sync Logs and Retry Logic: Detailed audit trail for billing attempts with automatic retry mechanisms
- Responsive Dashboard: Clean, intuitive UI built with modern React components
- 
QuickBooks Integration
- OAuth Authentication: Secure connection to QuickBooks Online sandbox/production environments
- Customer Synchronization: Automatically create QuickBooks customers from patient records
- Invoice Generation: Generate invoices in QuickBooks upon successful billing sync
- Company Information Display: View connected QuickBooks company details
- Token Management: Automatic token refresh for uninterrupted API access
- 
Advanced Features
- Error Handling: Comprehensive error management with user-friendly messages
- Mock Billing Simulation: Realistic external API simulation for testing
- Database Persistence: PostgreSQL with Drizzle ORM for reliable data storage
- Type-Safe Development: Full TypeScript implementation for maintainability

Technology Stack

Frontend
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Radix UI components for accessibility
- React Query for data fetching and caching
- React Hook Form with Zod validation

Backend
- Node.js with Express
- TypeScript for type safety
- Drizzle ORM with PostgreSQL
- Intuit OAuth SDK for QuickBooks integration
- Session Management with express-session

Infrastructure
- PostgreSQL database
- Docker support (optional)
- ESLint/Prettier for code quality

QuickBooks Integration Details

The application integrates with QuickBooks Online through the following APIs:

- Authentication: OAuth 2.0 flow for secure access
- Customer API: Creates customer records from patient data
- Invoice API: Generates invoices with line items for services
- Company API: Retrieves company information for display

Integration Flow
1. User authenticates with QuickBooks via OAuth
2. Patient records are created in the local database
3. "Export to QB" syncs patient as QuickBooks customer
4. "Sync Billing" creates invoice in QuickBooks upon successful mock billing
5. All operations are logged for audit and troubleshooting

Installation and Setup

Prerequisites

Node.js 18+

PostgreSQL 13+

QuickBooks Developer Account (for sandbox testing)

Local Development Setup

Clone the repository

git clone <repository-url>
cd great-design

Install dependencies

npm install

Database Setup

--Update .env with your PostgreSQL connection

DATABASE_URL=postgresql://user:password@localhost:5432/audiometry_db

--Create database

createdb audiometry_db

--Run migrations

npm run db:push

QuickBooks Configuration

--Add to .env

QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:5050/auth/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_BASE_URL=https://sandbox-quickbooks.api.intuit.com

Start the application

npm run dev

Access the app

- Frontend: http://localhost:5050
- API endpoints available at the same URL

QuickBooks Setup

1. Create a QuickBooks Developer account
2. Set up a sandbox company
3. Create an app and obtain client credentials
4. Configure redirect URI in QuickBooks app settings

Usage Guide
Getting Started
1. Visit the dashboard at http://localhost:5050
2. Click "New Patient Record" to add audiometry results
3. Fill in patient details and test measurements

QuickBooks Integration
1. Click "Company Info" to view connected QuickBooks company details
2. For each patient, click "Export to QB" to create a customer in QuickBooks
3. Click "Sync Billing" to simulate billing and create an invoice in QuickBooks
4. Monitor sync status and view detailed logs

Authentication Flow
- Visit /auth/quickbooks to initiate OAuth
- Complete authorization in QuickBooks
- Return to the app with active integration

API Documentation

Key Endpoints

Audiometry Management

GET /api/audiometry - List all patient records

POST /api/audiometry - Create new patient record

POST /api/audiometry/:id/sync - Trigger billing sync

QuickBooks Integration

GET /auth/quickbooks - Initiate OAuth flow

GET /auth/quickbooks/callback - OAuth callback

GET /api/quickbooks/company - Get company info

POST /api/quickbooks/customers - Create QuickBooks customer

Request/Response Examples

Create Patient Record:

POST /api/audiometry
{
  "patientName": "John Doe",
  "leftEarDb": 25,
  "rightEarDb": 30
}

Sync to QuickBooks:

POST /api/quickbooks/customers
{
  "patientId": 1
}

Database Schema

Tables

1. audiometry_results
id (serial, primary key)
patientName (text)
testDate (timestamp)
leftEarDb (integer)
rightEarDb (integer)
status (enum: NEW, BILLED, FAILED)
qbCustomerId (text, nullable)
createdAt (timestamp)

2. billing_sync_logs
id (serial, primary key)
audiometryId (integer)
status (enum: SUCCESS, FAILED)
errorType (enum)
errorMessage (text)
retryCount (integer)
qbInvoiceId (text, nullable)
createdAt (timestamp)

3. quickbooks_tokens
id (serial, primary key)
accessToken (text)
refreshToken (text)
expiresAt (timestamp)
realmId (text)
createdAt (timestamp)

Common Issues
QuickBooks Authentication Fails

Database Connection Issues

Confirm PostgreSQL is running

Verify DATABASE_URL in .env

Run npm run db:push to sync schema

Sync Errors

Check server logs for detailed error messages

Ensure QuickBooks tokens are valid

Verify patient has been exported as customer

Logs and Debugging

Server logs available in terminal when running npm run dev

Browser console for client-side errors

Database logs via PostgreSQL
