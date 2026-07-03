# Implementation Plan: Event Ticket Management System

## Overview

Implement the Event Ticket Management System as a Next.js 15 monorepo with PostgreSQL (Prisma ORM), NextAuth.js authentication, Zod validation, Zustand client state, and a REST API under `/api/v1/`. The implementation follows the order: database schema → auth → events → ticket types → bookings/tickets → venues/categories → OpenAPI → frontend → tests.

## Tasks

- [x] 1. Project Setup and Prisma Schema
  - Initialise a Next.js 15 project with TypeScript, Tailwind CSS v4, and the App Router
  - Install all dependencies: prisma, @prisma/client, next-auth, zod, zustand, bcryptjs, @types/bcryptjs, fast-check (devDep), vitest, supertest, @testing-library/react (devDeps), shadcn/ui components
  - Create `prisma/schema.prisma` with all models: User, Venue, Category, Event, TicketType, Booking, BookingItem, Ticket, Payment — including enums, relations, indexes, and constraints as specified in the design
  - Create `.env` with DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, JWT_SECRET, and placeholder payment keys
  - Create `Dockerfile` and `docker-compose.yml` (Postgres + Next.js app) and `docker-compose.test.yml` (test Postgres only)
  - Run `prisma migrate dev --name init` to generate the initial migration
  - Create `prisma/seed.ts` with demo data: 1 ADMIN user, 1 ORGANIZER, 2 USERs, 3 Venues, 4 Categories, 5 Events (DRAFT and PUBLISHED), TicketTypes with varying prices and quantities, and 2 sample Bookings
  - Add `prisma db seed` script to `package.json`
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 2. Shared Utilities: Response Envelope, Error Classes, and Zod Schemas
  - Create `src/lib/api/response.ts` with `successResponse<T>()` and `errorResponse()` helpers that produce the standard `{ success, data, meta }` / `{ success, error }` envelope
  - Create `src/lib/errors.ts` with a typed `AppError` class carrying `code`, `message`, and `httpStatus`
  - Create `src/lib/schemas/auth.schema.ts` (RegisterInput, LoginInput)
  - Create `src/lib/schemas/event.schema.ts` (CreateEventInput, UpdateEventInput, EventFilters)
  - Create `src/lib/schemas/ticketType.schema.ts` (CreateTicketTypeInput, UpdateTicketTypeInput)
  - Create `src/lib/schemas/booking.schema.ts` (CreateBookingInput)
  - Create `src/lib/schemas/venue.schema.ts` (CreateVenueInput, UpdateVenueInput)
  - Create `src/lib/schemas/category.schema.ts` (CreateCategoryInput, UpdateCategoryInput)
  - Create `src/lib/middleware/validate.ts` — a higher-order function that wraps a route handler and validates the request body against a Zod schema, returning 422 on failure
  - Create `src/lib/middleware/auth.ts` — extracts and verifies JWT from `Authorization` header, attaches user context; returns 401 if missing or invalid
  - Create `src/lib/middleware/rbac.ts` — checks that the authenticated user has one of the required roles; returns 403 if not
  - _Requirements: 13.1, 13.2, 13.3_

  - [ ]* 2.1 Write property test for response envelope invariant
    - **Property 12: Response envelope invariant**
    - For any mock handler that returns 2xx, verify body matches `{ success: true, data, meta }`. For any mock handler that returns 4xx/5xx, verify body matches `{ success: false, error: { code, message } }`
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [x] 3. Authentication Module
  - Create `src/lib/prisma.ts` — singleton Prisma client
  - Create `src/app/api/v1/auth/register/route.ts` — validates RegisterInput with Zod, hashes password with bcryptjs (cost factor 12), creates User with role USER, returns JWT + user profile; returns 409 on duplicate email, 422 on validation error
  - Create `src/app/api/v1/auth/login/route.ts` — validates credentials, compares bcrypt hash, returns JWT + profile; returns 401 on mismatch
  - Create `src/app/api/v1/auth/logout/route.ts` — invalidates token (stateless: client discards token; optionally token blocklist in Redis); returns 204
  - Create `src/app/api/v1/auth/me/route.ts` — protected; returns authenticated user's profile
  - Configure `src/middleware.ts` — apply JWT auth middleware to all `/api/v1/*` except `/auth/register` and `/auth/login`; apply rate limiting to `/auth/register`, `/auth/login`, and `/bookings` endpoints
  - Configure NextAuth.js (`src/app/api/auth/[...nextauth]/route.ts`) for credentials provider and optional OAuth
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 3.1 Write property test for registration uniqueness invariant
    - **Property 1: Registration uniqueness invariant**
    - Generate random valid user data; register twice with the same email; assert second call returns 409 and only one User exists in DB
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 3.2 Write property test for authentication round trip
    - **Property 2: Authentication round trip**
    - For any generated valid registration payload, register then login then call `/me`; assert `/me` returns same email and role USER
    - **Validates: Requirements 1.4, 1.7**

  - [ ]* 3.3 Write unit tests for auth validation
    - Test RegisterInput schema rejects missing fields, invalid email format, and short passwords
    - Test LoginInput schema rejects missing fields
    - _Requirements: 1.3_

- [x] 4. Checkpoint — Auth tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Venue and Category API
  - Create `src/lib/services/venue.service.ts` — listVenues (paginated, active only), getVenueById, createVenue, updateVenue, softDeleteVenue; throws `AppError` with appropriate codes
  - Create `src/app/api/v1/venues/route.ts` — GET (public, paginated), POST (Admin only)
  - Create `src/app/api/v1/venues/[id]/route.ts` — GET (public), PUT (Admin), DELETE (Admin)
  - Create `src/lib/services/category.service.ts` — listCategories, createCategory, updateCategory, softDeleteCategory
  - Create `src/app/api/v1/categories/route.ts` — GET (public), POST (Admin only)
  - Create `src/app/api/v1/categories/[id]/route.ts` — PUT (Admin), DELETE (Admin)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.1 Write property test for RBAC enforcement on venue/category mutations
    - **Property 3: RBAC enforcement — venue and category mutations**
    - Generate random USER and ORGANIZER tokens; for each venue/category mutation endpoint, assert HTTP 403. Generate ADMIN token; assert mutations succeed with valid input.
    - **Validates: Requirements 2.2, 3.2**

  - [ ]* 5.2 Write property test for soft-delete visibility
    - **Property 4: Soft-delete visibility invariant**
    - Create a venue/category, soft-delete it, call public GET list; assert the deleted record is absent. Call Admin GET list; assert it is present.
    - **Validates: Requirements 2.5, 3.5**

  - [ ]* 5.3 Write integration tests for venues and categories
    - Test all GET/POST/PUT/DELETE permutations for both resources
    - Test pagination meta correctness on list endpoints
    - _Requirements: 2.1–2.6, 3.1–3.5_

- [x] 6. Event Management API
  - Create `src/lib/services/event.service.ts` — listEvents (with filters: category, search, date range, status; sorting: startDateTime, title; pagination), getEventById, createEvent, updateEvent, softDeleteEvent; enforce owner or Admin for mutations
  - Create `src/app/api/v1/events/route.ts` — GET (public/Admin with role check), POST (ORGANIZER/ADMIN)
  - Create `src/app/api/v1/events/[id]/route.ts` — GET (public/Admin), PUT (owner Organizer/Admin), DELETE (owner Organizer/Admin)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12_

  - [ ]* 6.1 Write property test for event ownership enforcement
    - **Property 5: Event ownership enforcement**
    - Generate random events owned by Organizer A; generate tokens for Organizer B and USER; assert PUT/DELETE returns 403. Assert Organizer A and ADMIN can update.
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 6.2 Write property test for pagination meta consistency
    - **Property 11: Pagination meta consistency**
    - Generate N events (random N between 1 and 100), query with random page and limit values; assert meta.total = N, meta.totalPages = ceil(N/limit), len(data) ≤ limit.
    - **Validates: Requirements 4.9, 13.4**

  - [ ]* 6.3 Write integration tests for events API
    - Test CRUD lifecycle, search/filter/sort, status transitions, Admin vs public listing behaviour
    - _Requirements: 4.1–4.12_

- [x] 7. Ticket Type API
  - Create `src/lib/services/ticketType.service.ts` — listTicketTypes, getTicketTypeById, createTicketType (quantitySold=0), updateTicketType, softDeleteTicketType; enforce owner or Admin
  - Create `src/app/api/v1/events/[id]/ticket-types/route.ts` — GET (public), POST (owner Organizer/Admin)
  - Create `src/app/api/v1/events/[id]/ticket-types/[ttId]/route.ts` — PUT (owner Organizer/Admin), DELETE (owner Organizer/Admin)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 7.1 Write property test for TicketType quantitySold initialization
    - **Property 14: TicketType quantitySold initialization**
    - For any generated valid TicketType creation payload (random totalQuantity), assert the returned record has quantitySold = 0
    - **Validates: Requirements 5.2**

  - [ ]* 7.2 Write integration tests for ticket types API
    - Test CRUD, RBAC, quantitySold=0 on creation, 404 cases
    - _Requirements: 5.1–5.7_

- [x] 8. Booking and Ticket API
  - Create `src/lib/services/booking.service.ts`:
    - `createBooking()`: wrap in `prisma.$transaction()` with serializable isolation; use `SELECT FOR UPDATE` (raw query or Prisma `$lock`) on TicketType rows; verify inventory; create Booking (PENDING→CONFIRMED), BookingItems, Tickets (unique `ticketCode` via `cuid()`), Payment (PENDING); increment `quantitySold`; support idempotency key lookup before creating
    - `cancelBooking()`: check refund window (configurable, default 24h); update Booking→CANCELLED, Payment→REFUNDED, decrement `quantitySold` on each TicketType within a transaction
    - `getUserBookings()`: paginated by userId
    - `getBookingById()`: with BookingItems and Tickets included; requester must be booking owner or Admin
  - Create `src/app/api/v1/bookings/route.ts` — GET (authenticated user's bookings), POST (authenticated, rate-limited, idempotency key support)
  - Create `src/app/api/v1/bookings/[id]/route.ts` — GET (owner/Admin)
  - Create `src/app/api/v1/bookings/[id]/cancel/route.ts` — POST (owner/Admin)
  - Create `src/lib/services/ticket.service.ts`:
    - `getTicketByCode()`: fetch Ticket with BookingItem
    - `checkInTicket()`: verify caller is event's Organizer or Admin; if `checkedIn=true` throw `TICKET_ALREADY_CHECKED_IN`; else set `checkedIn=true`, `checkedInAt=now()`
  - Create `src/app/api/v1/tickets/[code]/route.ts` — GET (authenticated)
  - Create `src/app/api/v1/tickets/[code]/checkin/route.ts` — POST (Organizer/Admin)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.1 Write property test for inventory non-exceedance invariant
    - **Property 6: Inventory non-exceedance invariant**
    - Generate a TicketType with random totalQuantity (5–50); run N concurrent booking requests (N > totalQuantity); after all settle, assert ticketType.quantitySold ≤ totalQuantity and total Tickets created = quantitySold
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 8.2 Write property test for booking atomicity
    - **Property 7: Booking creation atomicity**
    - For any valid booking input that succeeds, assert exactly: 1 Booking (CONFIRMED), N BookingItems, sum(quantity) Tickets with unique codes, 1 Payment (PENDING). For any failing booking (invalid inventory), assert zero records created.
    - **Validates: Requirements 6.1, 6.4**

  - [ ]* 8.3 Write property test for inventory restoration on cancellation
    - **Property 8: Inventory restoration on cancellation**
    - For any confirmed booking, record initial quantitySold values; cancel within refund window; assert each TicketType.quantitySold decreased by exactly the booked quantity, Booking.status = CANCELLED, Payment.status = REFUNDED
    - **Validates: Requirements 6.7**

  - [ ]* 8.4 Write property test for booking idempotency
    - **Property 9: Booking idempotency**
    - For any booking request with an idempotency key, submit the same request twice; assert only one Booking exists and both responses return the same booking id
    - **Validates: Requirements 6.12**

  - [ ]* 8.5 Write property test for check-in idempotency guard
    - **Property 10: Check-in idempotency guard**
    - For any checked-in Ticket, submit a second check-in request; assert HTTP 409 and that `checkedIn` and `checkedInAt` are unchanged
    - **Validates: Requirements 7.2, 7.3**

  - [ ]* 8.6 Write property test for ticket sales window enforcement
    - **Property 13: Ticket sales window enforcement**
    - Generate TicketTypes with salesStart in the future or salesEnd in the past; submit booking requests; assert HTTP 422 with code TICKET_SALES_CLOSED and zero records created
    - **Validates: Requirements 6.10**

  - [ ]* 8.7 Write integration tests for bookings and tickets API
    - Test booking creation, cancellation, check-in, idempotency, inventory edge cases
    - _Requirements: 6.1–6.12, 7.1–7.5_

- [x] 9. Checkpoint — All API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. OpenAPI Specification
  - Create `src/app/api/v1/docs/route.ts` — returns the OpenAPI 3.1 YAML/JSON spec
  - Create `src/lib/openapi/spec.ts` — define full OpenAPI spec covering all endpoints, request/response schemas (generated from Zod schemas via `zod-to-openapi` or hand-authored), error responses, and security schemes (Bearer JWT)
  - Test that `GET /api/v1/docs` returns a valid OpenAPI document
  - _Requirements: 13.5_

- [x] 11. Frontend: Shared Layout and Components
  - Create `src/app/layout.tsx` — root layout with Tailwind CSS, shadcn/ui theme provider, NextAuth session provider, and Zustand hydration
  - Create `src/components/ui/` — re-export configured shadcn/ui components (Button, Card, Input, Select, Badge, Dialog, Skeleton, etc.)
  - Create `src/components/layout/Navbar.tsx` — navigation bar with links, auth state (login/logout), and role-based menu items
  - Create `src/components/layout/ErrorBoundary.tsx` — React error boundary with retry button for page-level error handling
  - Create `src/lib/stores/auth.store.ts` — Zustand store for current user session state
  - Create `src/lib/stores/booking.store.ts` — Zustand store for booking intent (selected ticket types and quantities)
  - Create `src/lib/api/client.ts` — typed fetch wrapper for all `/api/v1/*` calls with automatic JWT header injection and envelope unwrapping
  - _Requirements: 8.5, 8.6, 9.1_

- [x] 12. Frontend: Authentication Pages
  - Create `src/app/login/page.tsx` — login form using React Hook Form + Zod (LoginInput schema), submits via NextAuth `signIn()`, redirects to return URL or dashboard on success
  - Create `src/app/register/page.tsx` — registration form using React Hook Form + Zod (RegisterInput schema), calls `POST /api/v1/auth/register`, then auto-signs in
  - Implement protected route redirect logic in `src/middleware.ts` — redirect unauthenticated users from protected pages to `/login?returnUrl=...`
  - _Requirements: 1.1, 1.4, 9.2_

- [x] 13. Frontend: Public Event Listing (`/`)
  - Create `src/app/page.tsx` — server component that fetches initial PUBLISHED events via `GET /api/v1/events`
  - Create `src/components/events/EventCard.tsx` — displays event title, date, venue, category badge, and banner image using shadcn Card
  - Create `src/components/events/EventFilters.tsx` — client component with search input, category select, and date range picker; updates URL search params which trigger re-fetch
  - Create `src/components/events/EventGrid.tsx` — responsive grid with loading skeletons (shadcn Skeleton) and pagination controls
  - Implement URL-driven filtering: search params `?q=`, `?category=`, `?page=`, `?limit=` passed to API
  - _Requirements: 8.1, 8.2, 8.5, 8.6_

- [x] 14. Frontend: Event Detail Page (`/events/[id]`)
  - Create `src/app/events/[id]/page.tsx` — server component fetching event details and ticket types
  - Create `src/components/events/EventDetail.tsx` — displays full event info: title, description, banner, venue, dates, category
  - Create `src/components/events/TicketSelector.tsx` — client component listing TicketTypes with quantity steppers; computes total amount; dispatches to booking.store; "Book Now" CTA routes to `/checkout`; shows "Sold Out" badge when inventory = 0
  - _Requirements: 8.3, 8.4, 8.5, 8.6_

- [x] 15. Frontend: Checkout Page (`/checkout`)
  - Create `src/app/checkout/page.tsx` — protected client component; reads booking intent from booking.store; shows order summary (event name, ticket types, quantities, unit prices, total)
  - Create `src/components/checkout/OrderSummary.tsx` — renders line items from booking intent
  - Create `src/components/checkout/CheckoutForm.tsx` — confirm booking button; calls `POST /api/v1/bookings`; on success navigates to `/dashboard`; on 409 `INSUFFICIENT_INVENTORY` shows specific sold-out message; on other errors shows generic error
  - Ensure unauthenticated access redirects to `/login?returnUrl=/checkout`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 16. Frontend: User Dashboard (`/dashboard`)
  - Create `src/app/dashboard/page.tsx` — protected server component fetching user's bookings
  - Create `src/components/dashboard/BookingList.tsx` — table/list of bookings with event name, date, status badge, total amount, and "View Details" action
  - Create `src/components/dashboard/BookingDetail.tsx` — modal or drawer showing BookingItems, individual Tickets, and QR code for each ticket (using `qrcode.react` library rendering ticketCode as QR)
  - Create `src/components/dashboard/CancelBookingButton.tsx` — cancels eligible booking via `POST /api/v1/bookings/[id]/cancel`; updates UI to CANCELLED status; shows confirmation dialog before cancelling
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 17. Frontend: Organizer Event Management (`/organizer/events`)
  - Create `src/app/organizer/events/page.tsx` — protected (ORGANIZER/ADMIN), server component fetching organizer's events
  - Create `src/components/organizer/EventTable.tsx` — table with event title, status badge, dates, and action buttons (Edit, Publish, Cancel, Delete)
  - Create `src/components/organizer/EventForm.tsx` — create/edit form for Event fields (title, description, category select, venue select, dates, banner URL) using React Hook Form + Zod; submits to POST/PUT event endpoints
  - Create `src/app/organizer/events/[id]/attendees/page.tsx` — protected (owning Organizer/ADMIN); fetches paginated attendee list (Tickets with user info and check-in status)
  - Create `src/components/organizer/AttendeeTable.tsx` — displays attendee name, ticket type, check-in status; "Check In" button calls `POST /api/v1/tickets/[code]/checkin` and updates row
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 18. Frontend: Admin Panel (`/admin`)
  - Create `src/app/admin/page.tsx` — protected (ADMIN only), redirects non-Admin to 403 page
  - Create `src/components/admin/AdminNav.tsx` — tabs/sidebar for Users, Venues, Categories, Events, Bookings sections
  - Create `src/components/admin/UsersTable.tsx` — fetches all users via Admin API, displays id, name, email, role, createdAt
  - Create `src/components/admin/VenuesPanel.tsx` — venue list with inline create/edit/delete via venue API
  - Create `src/components/admin/CategoriesPanel.tsx` — category list with inline create/edit/delete via category API
  - Create `src/components/admin/EventsPanel.tsx` — all events including DRAFT/CANCELLED; full management actions
  - Create `src/components/admin/BookingsPanel.tsx` — all bookings with status, user, event info
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 19. Checkpoint — All frontend routes render without errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. End-to-End Wiring and Final Integration
  - Verify all API client calls in frontend components use correct endpoint paths and handle loading/error states with shadcn Skeleton and ErrorBoundary
  - Verify Zustand booking.store is cleared after successful checkout or page unload
  - Verify NextAuth session is propagated correctly to both server components (via `getServerSession`) and client components (via `useSession`)
  - Add `src/app/not-found.tsx` and `src/app/error.tsx` global pages
  - Verify `prisma db seed` populates all entities and the app loads correctly against seeded data
  - Run `docker-compose up` and smoke-test all major flows end-to-end (auth, booking, check-in)
  - _Requirements: 14.3, 14.4_

- [x] 21. Final Checkpoint — All tests pass and app runs in Docker
  - Run `vitest --run` and verify all unit and property tests pass
  - Run integration test suite against test database and verify all API endpoints pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with minimum 100 iterations per property (`fc.assert(fc.property(...), { numRuns: 100 })`)
- Unit/integration tests use Vitest with Supertest
- All route handlers follow the pattern: validate (Zod) → auth/RBAC check → call service → format envelope response
- Inventory locking in `createBooking` uses a Prisma `$transaction` with `isolation: 'Serializable'` or raw `SELECT ... FOR UPDATE` to prevent race conditions
- The `ticketCode` for each Ticket is generated using `cuid()` (collision-resistant, URL-safe)
- The refund window is configurable via `REFUND_WINDOW_HOURS` environment variable (default: 24)
- QR codes are generated client-side using `qrcode.react` from the ticket code string

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["6.1", "6.2", "6.3"] },
    { "id": 4, "tasks": ["7.1", "7.2"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7"] }
  ]
}
```
