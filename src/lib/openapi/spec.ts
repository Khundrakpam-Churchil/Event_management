export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Event Ticket Management API",
    version: "1.0.0",
    description:
      "REST API for browsing events, booking tickets, and managing attendees. All endpoints are under /api/v1/.",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtained from /auth/login or /auth/register",
      },
    },
    schemas: {
      // ── Enums ───────────────────────────────────────────────────────────
      Role: { type: "string", enum: ["USER", "ORGANIZER", "ADMIN"] },
      EventStatus: { type: "string", enum: ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"] },
      BookingStatus: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "REFUNDED"] },
      PaymentStatus: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] },

      // ── Pagination ──────────────────────────────────────────────────────
      PaginationMeta: {
        type: "object",
        properties: {
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
          totalPages: { type: "integer" },
        },
        required: ["total", "page", "limit", "totalPages"],
      },

      // ── Error ───────────────────────────────────────────────────────────
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "NOT_FOUND" },
              message: { type: "string", example: "Resource not found." },
            },
            required: ["code", "message"],
          },
        },
        required: ["success", "error"],
      },

      // ── Models ──────────────────────────────────────────────────────────
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/Role" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Venue: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          capacity: { type: "integer" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
      TicketType: {
        type: "object",
        properties: {
          id: { type: "string" },
          eventId: { type: "string" },
          name: { type: "string" },
          price: { type: "number" },
          totalQuantity: { type: "integer" },
          quantitySold: { type: "integer" },
          salesStart: { type: "string", format: "date-time" },
          salesEnd: { type: "string", format: "date-time" },
        },
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          status: { $ref: "#/components/schemas/EventStatus" },
          startDateTime: { type: "string", format: "date-time" },
          endDateTime: { type: "string", format: "date-time" },
          bannerImageUrl: { type: "string", nullable: true },
          venue: { $ref: "#/components/schemas/Venue" },
          category: { $ref: "#/components/schemas/Category" },
          ticketTypes: { type: "array", items: { $ref: "#/components/schemas/TicketType" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string" },
          ticketCode: { type: "string" },
          checkedIn: { type: "boolean" },
          checkedInAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      BookingItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          ticketTypeId: { type: "string" },
          quantity: { type: "integer" },
          unitPrice: { type: "number" },
          tickets: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          eventId: { type: "string" },
          status: { $ref: "#/components/schemas/BookingStatus" },
          totalAmount: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          bookingItems: { type: "array", items: { $ref: "#/components/schemas/BookingItem" } },
        },
      },
    },
  },

  paths: {
    // ── Auth ────────────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created, JWT returned" },
          "409": { description: "Email already exists" },
          "422": { description: "Validation error" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful, JWT returned" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (stateless — client discards token)",
        security: [{ BearerAuth: [] }],
        responses: { "204": { description: "Logged out" }, "401": { description: "Unauthorized" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "User profile" },
          "401": { description: "Unauthorized" },
        },
      },
    },

    // ── Events ──────────────────────────────────────────────────────────────
    "/events": {
      get: {
        tags: ["Events"],
        summary: "List published events (public) or all events (Admin)",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "city", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/EventStatus" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "sort", in: "query", schema: { type: "string" }, description: "e.g. -startDateTime" },
        ],
        responses: { "200": { description: "Paginated events list" } },
      },
      post: {
        tags: ["Events"],
        summary: "Create an event (Organizer/Admin)",
        security: [{ BearerAuth: [] }],
        responses: { "201": { description: "Event created" }, "403": { description: "Forbidden" } },
      },
    },
    "/events/{id}": {
      get: {
        tags: ["Events"],
        summary: "Get single event",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Event detail" }, "404": { description: "Not found" } },
      },
      put: {
        tags: ["Events"],
        summary: "Full update event (owner Organizer/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated event" }, "403": { description: "Forbidden" } },
      },
      patch: {
        tags: ["Events"],
        summary: "Partial update event (owner Organizer/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated event" } },
      },
      delete: {
        tags: ["Events"],
        summary: "Soft-delete event (owner Organizer/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" }, "403": { description: "Forbidden" } },
      },
    },

    // ── Ticket Types ─────────────────────────────────────────────────────────
    "/events/{id}/ticket-types": {
      get: {
        tags: ["Ticket Types"],
        summary: "List ticket types for event (public)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Ticket types list" } },
      },
      post: {
        tags: ["Ticket Types"],
        summary: "Add ticket type (owner Organizer/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Ticket type created" } },
      },
    },
    "/events/{id}/ticket-types/{ttId}": {
      put: {
        tags: ["Ticket Types"],
        summary: "Update ticket type (owner Organizer/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "ttId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Ticket Types"],
        summary: "Delete ticket type (owner Organizer/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "ttId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": { description: "Deleted" } },
      },
    },

    // ── Bookings ─────────────────────────────────────────────────────────────
    "/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "List user bookings (Admin: all)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "Paginated bookings" } },
      },
      post: {
        tags: ["Bookings"],
        summary: "Create a booking",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eventId", "items"],
                properties: {
                  eventId: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["ticketTypeId", "quantity"],
                      properties: {
                        ticketTypeId: { type: "string" },
                        quantity: { type: "integer", minimum: 1 },
                      },
                    },
                  },
                  idempotencyKey: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Booking created" },
          "409": { description: "Insufficient inventory" },
          "422": { description: "Event not bookable / sales closed" },
        },
      },
    },
    "/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Get booking detail (owner/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Booking detail with tickets" }, "404": { description: "Not found" } },
      },
    },
    "/bookings/{id}/cancel": {
      post: {
        tags: ["Bookings"],
        summary: "Cancel booking (owner/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Booking cancelled and refunded" },
          "422": { description: "Refund window expired" },
        },
      },
    },

    // ── Tickets ──────────────────────────────────────────────────────────────
    "/tickets/{code}": {
      get: {
        tags: ["Tickets"],
        summary: "Get ticket by code",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "code", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Ticket detail" }, "404": { description: "Not found" } },
      },
    },
    "/tickets/{code}/checkin": {
      post: {
        tags: ["Tickets"],
        summary: "Check in ticket at venue (Organizer/Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "code", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Checked in" },
          "409": { description: "Already checked in" },
          "403": { description: "Forbidden" },
        },
      },
    },

    // ── Venues ───────────────────────────────────────────────────────────────
    "/venues": {
      get: {
        tags: ["Venues"],
        summary: "List venues (public)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "Venues list" } },
      },
      post: {
        tags: ["Venues"],
        summary: "Create venue (Admin)",
        security: [{ BearerAuth: [] }],
        responses: { "201": { description: "Venue created" }, "403": { description: "Forbidden" } },
      },
    },
    "/venues/{id}": {
      get: {
        tags: ["Venues"],
        summary: "Get venue by ID (public)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Venue" }, "404": { description: "Not found" } },
      },
      put: {
        tags: ["Venues"],
        summary: "Update venue (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated venue" } },
      },
      delete: {
        tags: ["Venues"],
        summary: "Delete venue (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },

    // ── Categories ───────────────────────────────────────────────────────────
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories (public)",
        responses: { "200": { description: "Categories list" } },
      },
      post: {
        tags: ["Categories"],
        summary: "Create category (Admin)",
        security: [{ BearerAuth: [] }],
        responses: { "201": { description: "Category created" } },
      },
    },
    "/categories/{id}": {
      put: {
        tags: ["Categories"],
        summary: "Update category (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete category (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
  },
};
