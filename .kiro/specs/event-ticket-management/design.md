# Design Document: Event Ticket Management System

## Overview

The Event Ticket Management System is a monolithic Next.js 15 application that serves both the REST API (via Route Handlers) and the React frontend (via App Router pages). It uses PostgreSQL for persistence (accessed through Prisma ORM), NextAuth.js for authentication, Zod for request/response validation, and a role-based access control model (USER, ORGANIZER, ADMIN).

The system prioritises correctness of inventory management — booking creation must be concurrency-safe — and a consistent API response envelope across all endpoints.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 15 App                           │
│                                                                  │
│  ┌──────────────────────┐    ┌────────────────────────────────┐ │
│  │   App Router Pages   │    │    Route Handlers (API)        │ │
│  │  (React / Frontend)  │    │  /api/v1/*                     │ │
│  │                      │    │                                │ │
│  │  / (event listing)   │    │  Auth, Events, TicketTypes,    │ │
│  │  /events/[id]        │    │  Bookings, Tickets, Venues,    │ │
│  │  /checkout           │    │  Categories                    │ │
│  │  /dashboard          │◄───►                                │ │
│  │  /organizer/events   │    │  ┌────────────────────────┐   │ │
│  │  /admin              │    │  │   Middleware Layer      │   │ │
│  └──────────────────────┘    │  │  Auth / RBAC / Rate    │   │ │
│                               │  │  Limit / Validation    │   │ │
│  ┌──────────────────────┐    │  └────────────┬───────────┘   │ │
│  │   Zustand Stores     │    │               │               │ │
│  │  (client state)      │    │  ┌────────────▼───────────┐   │ │
│  └──────────────────────┘    │  │   Service Layer        │   │ │
│                               │  │  (business logic)      │   │ │
│                               │  └────────────┬───────────┘   │ │
│                               │               │               │ │
│                               │  ┌────────────▼───────────┐   │ │
│                               │  │   Prisma ORM           │   │ │
│                               │  └────────────┬───────────┘   │ │
│                               └───────────────┼───────────────┘ │
└───────────────────────────────────────────────┼─────────────────┘
                                                │
                                   ┌────────────▼───────────┐
                                   │     PostgreSQL          │
                                   └────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| App Router Pages | Server-rendered and client components for each UI route |
| Route Handlers | HTTP request parsing, auth/RBAC enforcement, Zod validation, response envelope formatting |
| Middleware | JWT verification, rate limiting, CORS |
| Service Layer | Business logic: inventory checks, transactions, status machine, idempotency |
| Prisma ORM | Database queries, transactions, migrations |
| Zustand Stores | Client-side state for cart/booking intent, UI state |

---

## Components and Interfaces

### API Route Structure

All routes are under `src/app/api/v1/`.

```
/api/v1/
  auth/
    register/     POST
    login/        POST
    logout/       POST
    me/           GET
  events/
    /             GET, POST
    [id]/         GET, PUT, DELETE
    [id]/ticket-types/   GET, POST
    [id]/ticket-types/[ttId]/  PUT, DELETE
  bookings/
    /             GET, POST
    [id]/         GET
    [id]/cancel/  POST
  tickets/
    [code]/       GET
    [code]/checkin/  POST
  venues/
    /             GET, POST
    [id]/         GET, PUT, DELETE
  categories/
    /             GET, POST
    [id]/         PUT, DELETE
  docs/           GET  (OpenAPI spec)
```

### Middleware Stack

```typescript
// src/middleware.ts
// Applied to /api/v1/* routes
// 1. JWT verification → attaches user to request context
// 2. Rate limiting (upstash/ratelimit or in-memory for dev)
// 3. CORS headers
```

### Service Interfaces

```typescript
// src/lib/services/booking.service.ts
interface CreateBookingInput {
  userId: string;
  eventId: string;
  items: Array<{ ticketTypeId: string; quantity: number }>;
  idempotencyKey?: string;
}

interface BookingService {
  createBooking(input: CreateBookingInput): Promise<Booking>;
  cancelBooking(bookingId: string, userId: string): Promise<Booking>;
  getUserBookings(userId: string, page: number, limit: number): Promise<PaginatedResult<Booking>>;
  getBookingById(bookingId: string, requesterId: string, requesterRole: Role): Promise<Booking>;
}

// src/lib/services/event.service.ts
interface EventService {
  listEvents(filters: EventFilters, pagination: Pagination, requesterRole?: Role): Promise<PaginatedResult<Event>>;
  getEventById(eventId: string, requesterRole?: Role): Promise<Event>;
  createEvent(data: CreateEventInput, organizerId: string): Promise<Event>;
  updateEvent(eventId: string, data: UpdateEventInput, requesterId: string, requesterRole: Role): Promise<Event>;
  deleteEvent(eventId: string, requesterId: string, requesterRole: Role): Promise<void>;
}

// src/lib/services/ticket.service.ts
interface TicketService {
  getTicketByCode(code: string): Promise<Ticket>;
  checkInTicket(code: string, requesterId: string, requesterRole: Role): Promise<Ticket>;
}
```

### Response Envelope Helpers

```typescript
// src/lib/api/response.ts
function successResponse<T>(data: T, meta?: PaginationMeta): NextResponse
function errorResponse(code: string, message: string, status: number): NextResponse

// Standard shape
type SuccessEnvelope<T> = { success: true; data: T; meta: PaginationMeta | null }
type ErrorEnvelope = { success: false; error: { code: string; message: string } }
```

### Zod Schemas

All request schemas live in `src/lib/schemas/`. Each schema is shared between client-side form validation (React Hook Form + Zod) and server-side route handler validation.

```
src/lib/schemas/
  auth.schema.ts       (RegisterInput, LoginInput)
  event.schema.ts      (CreateEventInput, UpdateEventInput, EventFilters)
  ticketType.schema.ts (CreateTicketTypeInput, UpdateTicketTypeInput)
  booking.schema.ts    (CreateBookingInput, CancelBookingInput)
  venue.schema.ts      (CreateVenueInput, UpdateVenueInput)
  category.schema.ts   (CreateCategoryInput, UpdateCategoryInput)
```

---

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma

enum Role {
  USER
  ORGANIZER
  ADMIN
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         Role      @default(USER)
  createdAt    DateTime  @default(now())
  bookings     Booking[]
  events       Event[]   @relation("OrganizerEvents")

  @@index([email])
}

model Venue {
  id        String   @id @default(cuid())
  name      String
  address   String
  city      String
  capacity  Int
  deletedAt DateTime?
  events    Event[]

  @@index([city])
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  deletedAt DateTime?
  events    Event[]
}

model Event {
  id             String      @id @default(cuid())
  title          String
  description    String
  category       Category    @relation(fields: [categoryId], references: [id])
  categoryId     String
  venue          Venue       @relation(fields: [venueId], references: [id])
  venueId        String
  organizer      User        @relation("OrganizerEvents", fields: [organizerId], references: [id])
  organizerId    String
  startDateTime  DateTime
  endDateTime    DateTime
  bannerImageUrl String?
  status         EventStatus @default(DRAFT)
  deletedAt      DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  ticketTypes    TicketType[]
  bookings       Booking[]

  @@index([status, deletedAt])
  @@index([organizerId])
  @@index([categoryId])
}

model TicketType {
  id            String    @id @default(cuid())
  event         Event     @relation(fields: [eventId], references: [id])
  eventId       String
  name          String
  price         Decimal   @db.Decimal(10, 2)
  totalQuantity Int
  quantitySold  Int       @default(0)
  salesStart    DateTime
  salesEnd      DateTime
  deletedAt     DateTime?
  bookingItems  BookingItem[]

  @@index([eventId])
}

model Booking {
  id             String        @id @default(cuid())
  user           User          @relation(fields: [userId], references: [id])
  userId         String
  event          Event         @relation(fields: [eventId], references: [id])
  eventId        String
  status         BookingStatus @default(PENDING)
  totalAmount    Decimal       @db.Decimal(10, 2)
  idempotencyKey String?       @unique
  createdAt      DateTime      @default(now())
  bookingItems   BookingItem[]
  payment        Payment?

  @@index([userId])
  @@index([eventId])
  @@index([idempotencyKey])
}

model BookingItem {
  id           String     @id @default(cuid())
  booking      Booking    @relation(fields: [bookingId], references: [id])
  bookingId    String
  ticketType   TicketType @relation(fields: [ticketTypeId], references: [id])
  ticketTypeId String
  quantity     Int
  unitPrice    Decimal    @db.Decimal(10, 2)
  tickets      Ticket[]

  @@index([bookingId])
  @@index([ticketTypeId])
}

model Ticket {
  id            String      @id @default(cuid())
  bookingItem   BookingItem @relation(fields: [bookingItemId], references: [id])
  bookingItemId String
  ticketCode    String      @unique
  checkedIn     Boolean     @default(false)
  checkedInAt   DateTime?

  @@index([ticketCode])
}

model Payment {
  id             String        @id @default(cuid())
  booking        Booking       @relation(fields: [bookingId], references: [id])
  bookingId      String        @unique
  amount         Decimal       @db.Decimal(10, 2)
  provider       String
  status         PaymentStatus @default(PENDING)
  transactionRef String?
  createdAt      DateTime      @default(now())
}
```

### Entity Relationships

```
User ─(1:N)─► Booking
User ─(1:N)─► Event (as Organizer)
Event ─(1:N)─► TicketType
Event ─(1:N)─► Booking
Event ──────► Venue
Event ──────► Category
Booking ─(1:N)─► BookingItem
Booking ─(1:1)─► Payment
BookingItem ──► TicketType
BookingItem ─(1:N)─► Ticket
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration uniqueness invariant

*For any* two successful registration requests, if both use the same email address, the second request SHALL return HTTP 409. The number of User records with a given email SHALL never exceed one.

**Validates: Requirements 1.1, 1.2**

---

### Property 2: Authentication round trip

*For any* valid User registration followed by a login with the same credentials, the login SHALL succeed and return a JWT that grants access to the `/me` endpoint, which SHALL return the same email and role as the registered user.

**Validates: Requirements 1.4, 1.7**

---

### Property 3: RBAC enforcement — venue and category mutations

*For any* request to create, update, or delete a Venue or Category, if the requesting User's role is not ADMIN, the response SHALL be HTTP 403. *For any* request from an ADMIN with valid input, the mutation SHALL succeed.

**Validates: Requirements 2.2, 3.2**

---

### Property 4: Soft-delete visibility invariant

*For any* entity (Event, Venue, Category, TicketType) that has been soft-deleted, the public listing endpoint SHALL NOT include that entity in its response. *For any* Admin listing, soft-deleted entities SHALL be retrievable.

**Validates: Requirements 2.5, 3.5, 4.8, 5.6**

---

### Property 5: Event ownership enforcement

*For any* Event update or delete request, if the requesting User is neither the owning Organizer nor an ADMIN, the response SHALL be HTTP 403. *For any* owning Organizer or ADMIN, the operation SHALL be permitted.

**Validates: Requirements 4.4, 4.5**

---

### Property 6: Inventory non-exceedance invariant

*For any* sequence of concurrent or sequential booking creation requests for a given TicketType, the final value of `quantitySold` SHALL never exceed `totalQuantity`. This property MUST hold under concurrent load.

**Validates: Requirements 6.2, 6.3**

---

### Property 7: Booking creation atomicity

*For any* successful booking creation, ALL of the following SHALL exist after the transaction commits: one Booking record with status CONFIRMED, one BookingItem per requested TicketType, one Ticket per unit quantity with a unique ticketCode, and one Payment record with status PENDING. If any step fails, NONE of these records SHALL be persisted (all-or-nothing).

**Validates: Requirements 6.1, 6.4**

---

### Property 8: Inventory restoration on cancellation

*For any* CONFIRMED Booking that is cancelled within the refund window, the sum of `quantitySold` across all associated TicketTypes SHALL decrease by exactly the quantities in the BookingItems. The Booking status SHALL be CANCELLED and Payment status SHALL be REFUNDED.

**Validates: Requirements 6.7**

---

### Property 9: Booking idempotency

*For any* booking creation request submitted with the same idempotency key, all subsequent requests (after the first succeeds) SHALL return the original Booking without creating new records.

**Validates: Requirements 6.12**

---

### Property 10: Check-in idempotency guard

*For any* Ticket that has been successfully checked in, any subsequent check-in request for that same ticket code SHALL return HTTP 409 without modifying the Ticket record. The `checkedIn` field and `checkedInAt` timestamp SHALL remain unchanged.

**Validates: Requirements 7.2, 7.3**

---

### Property 11: Pagination meta consistency

*For any* paginated API response, the `meta.total` field SHALL equal the true count of matching records, `meta.totalPages` SHALL equal `ceil(total / limit)`, and the number of items in `data` SHALL be at most `limit`.

**Validates: Requirements 4.9, 13.4**

---

### Property 12: Response envelope invariant

*For any* API response, if the HTTP status code is 2xx the response body SHALL match `{ success: true, data: <non-null>, meta: <object|null> }`. If the HTTP status code is 4xx or 5xx the response body SHALL match `{ success: false, error: { code: <non-empty string>, message: <non-empty string> } }`.

**Validates: Requirements 13.1, 13.2, 13.3**

---

### Property 13: Ticket sales window enforcement

*For any* booking request for a TicketType where the current time is before `salesStart` or after `salesEnd`, the System SHALL return HTTP 422 with code `TICKET_SALES_CLOSED` without creating any records.

**Validates: Requirements 6.10**

---

### Property 14: TicketType quantitySold initialization

*For any* newly created TicketType, the initial `quantitySold` value SHALL be exactly 0 regardless of the `totalQuantity` specified.

**Validates: Requirements 5.2**

---

## Error Handling

### Error Code Registry

| Error Code | HTTP Status | Description |
|------------|------------|-------------|
| `EMAIL_ALREADY_EXISTS` | 409 | Registration email already in use |
| `INVALID_CREDENTIALS` | 401 | Login email/password mismatch |
| `UNAUTHORIZED` | 401 | No valid session token provided |
| `FORBIDDEN` | 403 | Authenticated but insufficient role |
| `EVENT_NOT_FOUND` | 404 | Event does not exist or is inaccessible |
| `VENUE_NOT_FOUND` | 404 | Venue does not exist |
| `TICKET_TYPE_NOT_FOUND` | 404 | TicketType does not exist |
| `TICKET_NOT_FOUND` | 404 | Ticket code does not exist |
| `BOOKING_NOT_FOUND` | 404 | Booking does not exist |
| `INSUFFICIENT_INVENTORY` | 409 | Requested quantity exceeds available stock |
| `TICKET_ALREADY_CHECKED_IN` | 409 | Ticket has already been checked in |
| `EVENT_NOT_BOOKABLE` | 422 | Event is not in PUBLISHED status |
| `TICKET_SALES_CLOSED` | 422 | TicketType sales window not active |
| `REFUND_WINDOW_EXPIRED` | 422 | Cancellation outside the refund window |
| `VALIDATION_ERROR` | 422 | Request body fails Zod schema validation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests to rate-limited endpoint |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server-side error |

### Error Handling Strategy

1. **Zod validation middleware**: Parses and validates request body/query against the relevant schema before the handler runs. Returns 422 `VALIDATION_ERROR` with field-level details on failure.
2. **Service-layer errors**: Service functions throw typed errors (e.g., `AppError` with code and status). Route handlers catch these and convert to the envelope format.
3. **Database errors**: Prisma unique constraint violations mapped to 409 responses. Transaction failures rolled back and surfaced as `INTERNAL_SERVER_ERROR`.
4. **Unhandled errors**: A top-level try/catch in each route handler catches any unhandled error and returns 500 `INTERNAL_SERVER_ERROR` without leaking stack traces to the client.
5. **Frontend error boundaries**: Each page-level component is wrapped in an error boundary that displays a user-friendly message and a retry button.

---

## Testing Strategy

### Dual Testing Approach

The project uses both **property-based tests** (Vitest + fast-check) for universal correctness properties and **example-based unit/integration tests** (Vitest + Supertest) for specific scenarios and API surface validation.

### Property-Based Tests (Vitest + fast-check)

Property-based tests validate the 14 correctness properties defined above. Each test generates hundreds of random inputs to exercise edge cases that example-based tests would miss.

**Configuration**: Each property test runs a minimum of 100 iterations (`numRuns: 100` in fast-check). Each test is annotated with the property number and requirements it validates.

Tag format: `// Feature: event-ticket-management, Property N: <property text>`

Key properties to implement as PBT:
- **Property 6** (Inventory non-exceedance): Generate random sequences of concurrent booking requests and verify quantitySold ≤ totalQuantity after all complete.
- **Property 7** (Booking atomicity): Generate random valid/invalid booking inputs and verify all-or-nothing persistence.
- **Property 8** (Inventory restoration): Generate bookings, cancel them, verify inventory restored exactly.
- **Property 10** (Check-in idempotency): Generate check-in sequences and verify 409 on duplicates.
- **Property 11** (Pagination consistency): Generate random datasets and page parameters, verify meta matches.
- **Property 12** (Response envelope): For any handler call, verify envelope structure matches status code.

### Unit Tests (Vitest)

Unit tests cover service-layer functions directly (bypassing HTTP):
- `booking.service.ts`: createBooking, cancelBooking with mocked Prisma client
- `event.service.ts`: RBAC checks, filter logic
- `ticket.service.ts`: checkInTicket idempotency
- Zod schema validation: all schemas with valid and invalid inputs

### Integration Tests (Supertest)

Integration tests exercise the full HTTP stack:
- All `POST /api/v1/auth/*` endpoints
- All `GET|POST|PUT|DELETE /api/v1/events/*` endpoints
- All `POST /api/v1/bookings/*` and cancellation
- All `POST /api/v1/tickets/*/checkin` endpoints
- All `GET|POST|PUT|DELETE /api/v1/venues/*` endpoints
- All `GET|POST|PUT|DELETE /api/v1/categories/*` endpoints

Integration tests use a test PostgreSQL database (separate from dev DB, managed by `docker-compose.test.yml`), and each test suite resets the database state using `prisma migrate reset --force`.

### Frontend Tests

- Component-level snapshot tests using Vitest + React Testing Library for key components (EventCard, BookingForm, TicketQR).
- No property-based tests for UI components (not appropriate for rendering logic).
