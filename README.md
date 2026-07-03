# Event Ticket Management System

A full-stack event ticketing platform built with Next.js 15, Prisma, PostgreSQL, and Tailwind CSS.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Zustand, React Hook Form + Zod
- **Backend**: Next.js Route Handlers (REST API under `/api/v1/`)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Custom JWT + NextAuth.js (credentials provider)
- **Testing**: Vitest, fast-check (property-based tests)

---

## Prerequisites

- Node.js 18+
- Docker & Docker Compose (for local Postgres)
- npm 9+

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd event-ticket-management
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/event_ticket_db?schema=public"
JWT_SECRET="your-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start Postgres

```bash
docker-compose up -d postgres
```

### 4. Run migrations and seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker (full stack)

```bash
docker-compose up --build
```

This starts both Postgres and the Next.js app. The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Seed Credentials

All seed users have password: `Password123!`

| Role      | Email                    |
|-----------|--------------------------|
| Admin     | admin@example.com        |
| Organizer | organizer@example.com    |
| User      | bob@example.com          |
| User      | carol@example.com        |

---

## API

All endpoints are under `/api/v1/`. Interactive docs available at:

```
GET /api/v1/docs
```

### Auth

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Get profile (replace TOKEN)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Events

```bash
# List published events
curl http://localhost:3000/api/v1/events

# Search and filter
curl "http://localhost:3000/api/v1/events?q=music&category=Music&page=1&limit=10"

# Get single event
curl http://localhost:3000/api/v1/events/EVENT_ID

# Create event (Organizer/Admin)
curl -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Event",
    "description": "Event description",
    "categoryId": "CATEGORY_ID",
    "venueId": "VENUE_ID",
    "startDateTime": "2025-06-01T18:00:00.000Z",
    "endDateTime": "2025-06-01T22:00:00.000Z"
  }'
```

### Bookings

```bash
# Create booking
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "EVENT_ID",
    "items": [{"ticketTypeId": "TT_ID", "quantity": 2}],
    "idempotencyKey": "unique-key-001"
  }'

# List my bookings
curl http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer TOKEN"

# Cancel booking
curl -X POST http://localhost:3000/api/v1/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer TOKEN"
```

### Tickets

```bash
# Get ticket by code
curl http://localhost:3000/api/v1/tickets/TICKET_CODE \
  -H "Authorization: Bearer TOKEN"

# Check in ticket (Organizer/Admin)
curl -X POST http://localhost:3000/api/v1/tickets/TICKET_CODE/checkin \
  -H "Authorization: Bearer TOKEN"
```

---

## Available Scripts

| Script             | Description                        |
|--------------------|------------------------------------|
| `npm run dev`      | Start development server           |
| `npm run build`    | Build for production               |
| `npm run test`     | Run all tests                      |
| `npm run db:migrate` | Run Prisma migrations            |
| `npm run db:seed`  | Seed demo data                     |
| `npm run db:reset` | Reset and re-migrate database      |
| `npm run db:studio`| Open Prisma Studio                 |

---

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── api/v1/             # REST API handlers
│   ├── (auth pages)        # /login, /register
│   ├── events/             # Public event pages
│   ├── checkout/           # Checkout flow
│   ├── dashboard/          # User dashboard
│   ├── organizer/          # Organizer management
│   └── admin/              # Admin panel
├── src/
│   ├── lib/
│   │   ├── api/            # Response helpers, API client
│   │   ├── middleware/      # Auth, RBAC, validation middleware
│   │   ├── schemas/         # Zod schemas (shared client + server)
│   │   ├── services/        # Business logic services
│   │   ├── stores/          # Zustand client stores
│   │   └── openapi/         # OpenAPI spec
│   └── components/          # React components by domain
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Demo data seed
│   └── migrations/          # Migration history
└── docker-compose.yml       # Local development setup
```

---

## Response Format

All API responses use a consistent envelope:

```json
// Success
{ "success": true, "data": {}, "meta": null }

// Paginated success
{ "success": true, "data": [], "meta": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Resource not found." } }
```
