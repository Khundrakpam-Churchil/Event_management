// Feature: event-ticket-management
// Unit tests for response envelope helpers (Requirements 13.1, 13.2, 13.3)

import { describe, it, expect } from "vitest";
import { successResponse, errorResponse } from "../response";

describe("successResponse", () => {
  it("produces { success: true, data, meta: null } by default", async () => {
    const res = successResponse({ id: "1", name: "Test" });
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: "1", name: "Test" });
    expect(body.meta).toBeNull();
    expect(res.status).toBe(200);
  });

  it("includes pagination meta when provided", async () => {
    const meta = { total: 50, page: 2, limit: 10, totalPages: 5 };
    const res = successResponse([1, 2, 3], meta);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.meta).toEqual(meta);
  });

  it("uses the provided HTTP status code", async () => {
    const res = successResponse({ id: "abc" }, null, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("never has an error key on success", async () => {
    const res = successResponse({ ok: true });
    const body = await res.json();
    expect(body).not.toHaveProperty("error");
  });
});

describe("errorResponse", () => {
  it("produces { success: false, error: { code, message } }", async () => {
    const res = errorResponse("NOT_FOUND", "Resource not found.", 404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Resource not found.");
    expect(res.status).toBe(404);
  });

  it("never has a data key on error", async () => {
    const res = errorResponse("UNAUTHORIZED", "Not allowed.", 401);
    const body = await res.json();
    expect(body).not.toHaveProperty("data");
  });

  it("returns 422 for validation errors", async () => {
    const res = errorResponse("VALIDATION_ERROR", "email: Invalid email.", 422);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 for internal errors", async () => {
    const res = errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong.", 500);
    expect(res.status).toBe(500);
  });
});
