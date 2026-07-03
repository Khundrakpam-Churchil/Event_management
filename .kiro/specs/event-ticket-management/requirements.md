# Requirements Document

## Introduction

The Event Ticket Management System is a full-stack web application that enables event organizers to create and manage events, sell tickets, and track attendance. End users can browse events, purchase tickets, and manage their bookings. Administrators oversee the entire platform including users, venues, categories, and events. The system is built as a Next.js 15 application with a REST API layer backed by PostgreSQL via Prisma ORM, JWT-based authentication with role-based access control, and a modern React frontend using Tailwind CSS and shadcn/ui.

## Glossary

- **System**: The Event Ticket Management System application
- **API**: The REST API layer exposed under `/api/v1/`
- **User**: An authenticated end-user with role USER, ORGANIZER, or ADMIN
- **Organizer**: A User with the ORGANIZER role who can create and manage events
- **Admin**: A User with the ADMIN role who has full platform access
- **Event**: A scheduled gathering with title, description, venue, dates, and status
- **Venue**: A physical location with name, address, city, and capacity
- **TicketType**: A category of ticket for a specific Event with price and quantity limits
- **Booking**: A reservation by a User for one or more TicketTypes within an Event
- **BookingItem**: A line item within a Booking referencing a specific TicketType and quantity
- **Ticket**: An individual admission credential associated with a BookingItem, identified by a unique ticket code
- **Payment**: A financial transaction record associated with a Booking
- **CheckIn**: The process of validating a Ticket at the event venue
- **Inventory**: The available quantity of a TicketType (totalQuantity minus quantitySold)
- **Refund Window**: The configurable time period after booking within which cancellation triggers a refund
- **Soft-Delete**: Marking a record as cancelled or inactive rather than physically removing it
- **Response Envelope**: The standard JSON wrapper `{ success, data, meta }` or `{ success, error: { code, message } }`
- **JWT**: JSON Web Token used for session authentication
- **RBAC**: Role-Based Access Control governing what each role may do
- **ORM**: Object-Relational Mapper (Prisma) used to interact with PostgreSQL
- **Seed Script**: A script that populates the database with demo data for development

---

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a visitor, I want to register an account and log in, so that I can purchase tickets and manage my bookings.

#### Acceptance Criteria

1. WHEN a visitor submits a valid registration request with name, email, and password, THE System SHALL create a new User record with role USER, store a bcrypt-hashed password, and return a JWT session token.
2. WHEN a visitor submits a registration request with an email that already exists, THE System SHALL return HTTP 409 with error code `EMAIL_ALREADY_EXISTS`.
3. WHEN a visitor submits a registration request with an invalid or missing field, THE System SHALL return HTTP 422 with a field-level validation error object.
4. WHEN a registered User submits valid credentials to the login endpoint, THE System SHALL return a JWT token and the User's profile (id, name, email, role).
5. WHEN a User submits invalid credentials to the login endpoint, THE System SHALL return HTTP 401 with error code `INVALID_CREDENTIALS`.
6. WHEN an authenticated User calls the logout endpoint, THE System SHALL invalidate the session token and return HTTP 204.
7. WHEN an authenticated User calls the `/me` endpoint, THE System SHALL return the User's profile (id, name, email, role, createdAt).
8. WHEN an unauthenticated request is made to a protected endpoint, THE System SHALL return HTTP 401 with error code `UNAUTHORIZED`.
9. THE System SHALL apply rate limiting to the `/register` and `/login` endpoints, rejecting requests that exceed the configured threshold with HTTP 429.
10. WHERE OAuth providers are configured, THE System SHALL support OAuth-based login in addition to credentials-based login.

---

### Requirement 2: Venue Management

**User Story:** As an Admin, I want to create and manage venues, so that Organizers can associate events with physical locations.

#### Acceptance Criteria

1. WHEN an Admin submits a valid venue creation request with name, address, city, and capacity, THE System SHALL create a Venue record and return HTTP 201 with the created Venue.
2. WHEN a non-Admin User attempts to create, update, or delete a Venue, THE System SHALL return HTTP 403 with error code `FORBIDDEN`.
3. WHEN any authenticated or unauthenticated caller requests a list of Venues, THE System SHALL return a paginated list of all active Venues.
4. WHEN an Admin submits a valid venue update request, THE System SHALL update the Venue record and return the updated Venue with HTTP 200.
5. WHEN an Admin requests deletion of a Venue, THE System SHALL soft-delete the Venue and return HTTP 204.
6. WHEN a caller requests a Venue by id that does not exist, THE System SHALL return HTTP 404 with error code `VENUE_NOT_FOUND`.

---

### Requirement 3: Category Management

**User Story:** As an Admin, I want to create and manage event categories, so that events can be organized and filtered by type.

#### Acceptance Criteria

1. WHEN an Admin submits a valid category creation request with a name, THE System SHALL create a Category record and return HTTP 201.
2. WHEN a non-Admin User attempts to create, update, or delete a Category, THE System SHALL return HTTP 403 with error code `FORBIDDEN`.
3. WHEN any caller requests the list of Categories, THE System SHALL return all active Categories.
4. WHEN an Admin submits a valid category update, THE System SHALL update the Category record and return HTTP 200.
5. WHEN an Admin requests deletion of a Category, THE System SHALL soft-delete the Category and return HTTP 204.

---

### Requirement 4: Event Management

**User Story:** As an Organizer, I want to create, edit, publish, and cancel events, so that I can promote and manage my events on the platform.

#### Acceptance Criteria

1. WHEN an Organizer submits a valid event creation request, THE System SHALL create an Event with status DRAFT, associate it with the requesting Organizer's id, and return HTTP 201.
2. THE System SHALL require that every Event has a title, description, category, venueId, organizerId, startDateTime, and endDateTime.
3. WHEN an Organizer updates an Event they own, THE System SHALL update the Event record and return the updated Event with HTTP 200.
4. WHEN an Admin updates any Event, THE System SHALL update the Event record and return the updated Event with HTTP 200.
5. WHEN a User who is neither the owning Organizer nor an Admin attempts to update an Event, THE System SHALL return HTTP 403.
6. WHEN an Organizer or Admin sets Event status to CANCELLED, THE System SHALL update the Event status and prevent future bookings for that Event.
7. WHEN an Organizer or Admin sets Event status to PUBLISHED, THE System SHALL make the Event visible in public listings.
8. WHEN an Organizer or Admin requests soft-deletion of an Event, THE System SHALL mark the Event as deleted and return HTTP 204.
9. WHEN a public caller requests the event listing, THE System SHALL return only PUBLISHED, non-deleted Events with pagination support (page, limit) and meta (total, page, limit, totalPages).
10. WHEN a public caller provides search, filter, or sort parameters, THE System SHALL apply them and return the filtered/sorted paginated result.
11. WHEN an Admin requests the event listing, THE System SHALL return all Events including DRAFT, CANCELLED, COMPLETED, and soft-deleted records.
12. WHEN a caller requests an Event by id that does not exist or is soft-deleted (for non-Admin), THE System SHALL return HTTP 404 with error code `EVENT_NOT_FOUND`.

---

### Requirement 5: Ticket Type Management

**User Story:** As an Organizer, I want to define ticket types for my events, so that I can offer different pricing tiers and control availability.

#### Acceptance Criteria

1. WHEN an Organizer or Admin submits a valid TicketType creation request for an Event they own (or any Event for Admin), THE System SHALL create the TicketType with the specified name, price, totalQuantity, salesStart, and salesEnd, and return HTTP 201.
2. WHEN a caller creates a TicketType, THE System SHALL initialize quantitySold to 0.
3. WHEN an Organizer or Admin submits a valid TicketType update request, THE System SHALL update the record and return HTTP 200.
4. WHEN a User who is not the owning Organizer or Admin attempts to create or modify a TicketType, THE System SHALL return HTTP 403.
5. WHEN a caller requests all TicketTypes for an Event, THE System SHALL return the list of TicketTypes including current quantitySold values.
6. WHEN an Organizer or Admin deletes a TicketType, THE System SHALL soft-delete the record and return HTTP 204.
7. WHEN a caller requests a TicketType by id that does not exist, THE System SHALL return HTTP 404 with error code `TICKET_TYPE_NOT_FOUND`.

---

### Requirement 6: Booking and Inventory Management

**User Story:** As a User, I want to book tickets for an event, so that I can attend the event and receive admission credentials.

#### Acceptance Criteria

1. WHEN an authenticated User submits a valid booking request for a PUBLISHED Event, THE System SHALL create a Booking with status PENDING within a database transaction.
2. WHEN creating a Booking, THE System SHALL lock the relevant TicketType rows and verify that requested quantity does not exceed available inventory (totalQuantity - quantitySold) for each TicketType before committing.
3. IF the requested quantity exceeds available inventory, THEN THE System SHALL return HTTP 409 with error code `INSUFFICIENT_INVENTORY` and roll back the transaction.
4. WHEN a Booking is successfully created, THE System SHALL increment quantitySold on each TicketType by the booked quantity, create BookingItem records, create individual Ticket records with unique ticket codes, create a Payment record with status PENDING, and set Booking status to CONFIRMED.
5. WHEN a User requests their booking list, THE System SHALL return all Bookings for that User with pagination.
6. WHEN a User or Admin requests a Booking by id, THE System SHALL return the Booking with its BookingItems and associated Tickets.
7. WHEN a User cancels a CONFIRMED Booking within the refund window, THE System SHALL update Booking status to CANCELLED, update Payment status to REFUNDED, and decrement quantitySold on each associated TicketType by the cancelled quantity.
8. IF a User attempts to cancel a Booking outside the refund window, THEN THE System SHALL return HTTP 422 with error code `REFUND_WINDOW_EXPIRED`.
9. WHEN a User attempts to book tickets for an Event that is not PUBLISHED, THE System SHALL return HTTP 422 with error code `EVENT_NOT_BOOKABLE`.
10. WHEN a User attempts to book a TicketType whose salesStart or salesEnd window is not currently active, THE System SHALL return HTTP 422 with error code `TICKET_SALES_CLOSED`.
11. THE System SHALL apply rate limiting to the booking creation endpoint.
12. THE System SHALL support an idempotency key on booking creation so that duplicate requests within the idempotency window return the original Booking rather than creating a new one.

---

### Requirement 7: Ticket Management and Check-In

**User Story:** As an Organizer, I want to check in attendees at the event, so that I can verify admission and track attendance.

#### Acceptance Criteria

1. WHEN an authenticated User requests a Ticket by its ticket code, THE System SHALL return the Ticket details including checkedIn status and associated BookingItem information.
2. WHEN an Organizer or Admin submits a check-in request for a Ticket that has not yet been checked in, THE System SHALL set checkedIn to true, record checkedInAt timestamp, and return HTTP 200.
3. WHEN an Organizer or Admin submits a check-in request for a Ticket that has already been checked in, THE System SHALL return HTTP 409 with error code `TICKET_ALREADY_CHECKED_IN` without modifying the Ticket record.
4. WHEN a User who is not the Organizer of the associated Event or an Admin attempts to perform check-in, THE System SHALL return HTTP 403.
5. WHEN a caller requests a Ticket by code that does not exist, THE System SHALL return HTTP 404 with error code `TICKET_NOT_FOUND`.

---

### Requirement 8: Frontend — Public Event Discovery

**User Story:** As a visitor, I want to browse and search for events, so that I can find events I want to attend.

#### Acceptance Criteria

1. WHEN a visitor loads the homepage `/`, THE System SHALL display a paginated list of PUBLISHED events with title, date, venue, category, and banner image.
2. WHEN a visitor enters a search term or applies category/date filters, THE System SHALL update the event listing to show matching results without full page reload.
3. WHEN a visitor clicks on an event, THE System SHALL navigate to `/events/[id]` and display full event details including description, venue, start/end times, and available TicketTypes with prices and availability.
4. WHEN all TicketTypes for an event are sold out, THE System SHALL display a "Sold Out" indicator and disable the booking CTA.
5. WHEN an event is loading, THE System SHALL display loading skeleton states rather than blank content.
6. IF an error occurs loading event data, THEN THE System SHALL display an error boundary with a retry option.

---

### Requirement 9: Frontend — Checkout and Booking Flow

**User Story:** As an authenticated User, I want to select ticket quantities and complete a booking, so that I can secure my attendance at an event.

#### Acceptance Criteria

1. WHEN an authenticated User selects ticket types and quantities on the event detail page and clicks the booking CTA, THE System SHALL navigate to `/checkout` with booking intent state preserved.
2. WHEN a visitor who is not authenticated clicks the booking CTA, THE System SHALL redirect to `/login` with a return URL to complete the booking after login.
3. WHEN a User reviews and confirms the checkout summary, THE System SHALL submit the booking request to the API and display a confirmation or error.
4. WHEN a booking is confirmed, THE System SHALL navigate to the User's dashboard and display the new booking with ticket codes.
5. WHEN a booking request fails due to insufficient inventory, THE System SHALL display a specific message indicating the tickets are no longer available.
6. WHEN a User is on the checkout page, THE System SHALL display an order summary including event name, ticket types, quantities, unit prices, and total amount.

---

### Requirement 10: Frontend — User Dashboard

**User Story:** As an authenticated User, I want to view and manage my bookings and tickets, so that I can access my event credentials and cancel if needed.

#### Acceptance Criteria

1. WHEN an authenticated User navigates to `/dashboard`, THE System SHALL display all the User's bookings with event name, date, status, and total amount.
2. WHEN a User selects a booking, THE System SHALL display the booking details including all BookingItems and individual Ticket records with QR codes generated from ticket codes.
3. WHEN a User cancels an eligible Booking, THE System SHALL submit a cancellation request, update the UI to reflect CANCELLED status, and display a confirmation message.
4. WHEN a User views a CANCELLED or REFUNDED booking, THE System SHALL display the appropriate status and prevent further cancellation attempts.

---

### Requirement 11: Frontend — Organizer Event Management

**User Story:** As an Organizer, I want to create, edit, and manage my events and view attendee information, so that I can run my events effectively.

#### Acceptance Criteria

1. WHEN an Organizer navigates to `/organizer/events`, THE System SHALL display a list of all Events owned by that Organizer with status badges and action buttons.
2. WHEN an Organizer creates or edits an Event via the organizer UI, THE System SHALL submit the form data to the API and reflect the result in the event list.
3. WHEN an Organizer navigates to `/organizer/events/[id]/attendees`, THE System SHALL display a paginated attendee list with name, ticket type, check-in status, and a check-in action.
4. WHEN an Organizer performs a check-in via the attendee list, THE System SHALL submit the check-in request and update the row to reflect checked-in status.
5. WHEN an Organizer accesses the attendee page for an Event they do not own, THE System SHALL redirect to a 403 page.

---

### Requirement 12: Frontend — Admin Panel

**User Story:** As an Admin, I want a management panel to oversee all platform data, so that I can maintain platform health and handle issues.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin`, THE System SHALL display navigation tabs or sections for Users, Venues, Categories, Events, and Bookings.
2. WHEN an Admin views the Users section, THE System SHALL display all Users with role, email, and account creation date.
3. WHEN an Admin views the Venues section, THE System SHALL display all Venues and provide create, edit, and delete actions.
4. WHEN an Admin views the Categories section, THE System SHALL display all Categories and provide create, edit, and delete actions.
5. WHEN an Admin views the Events section, THE System SHALL display all Events including DRAFT and cancelled Events with full management actions.
6. WHEN a non-Admin User attempts to access `/admin`, THE System SHALL return a 403 page.

---

### Requirement 13: API Response Standards and Error Handling

**User Story:** As a developer integrating with the API, I want consistent response envelopes and error codes, so that I can reliably handle success and failure cases.

#### Acceptance Criteria

1. THE System SHALL wrap all successful API responses in the envelope `{ success: true, data: <payload>, meta: <pagination | null> }`.
2. THE System SHALL wrap all error API responses in the envelope `{ success: false, error: { code: <string>, message: <string> } }`.
3. THE System SHALL use HTTP status code 200 for successful reads, 201 for successful creates, 204 for successful deletes, 400 for malformed requests, 401 for unauthenticated access, 403 for forbidden access, 404 for not found, 409 for conflicts, 422 for unprocessable entities, and 500 for server errors.
4. WHEN a paginated endpoint is called, THE System SHALL include meta `{ total, page, limit, totalPages }` in the response envelope.
5. THE System SHALL expose an OpenAPI/Swagger specification at `/api/v1/docs`.

---

### Requirement 14: Infrastructure and Developer Experience

**User Story:** As a developer, I want a reproducible local environment and automated tests, so that I can develop and verify the system reliably.

#### Acceptance Criteria

1. THE System SHALL include a Prisma schema defining all entities with appropriate relations, indexes, and constraints.
2. THE System SHALL include a seed script that populates the database with demo Users (one per role), Venues, Categories, Events, TicketTypes, and Bookings.
3. THE System SHALL include a Dockerfile and a docker-compose file that starts the PostgreSQL database and the Next.js application for local development.
4. THE System SHALL read all environment-specific configuration (database URL, JWT secret, OAuth credentials, payment keys) from environment variables defined in a `.env` file.
5. THE System SHALL include unit tests for booking creation logic and inventory management using Vitest.
6. THE System SHALL include integration tests for all REST API endpoints using Supertest.
