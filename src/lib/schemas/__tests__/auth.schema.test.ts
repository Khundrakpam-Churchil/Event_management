// Feature: event-ticket-management
// Unit tests for auth Zod schemas (Requirement 1.3)

import { describe, it, expect } from "vitest";
import { RegisterInputSchema, LoginInputSchema } from "../auth.schema";

describe("RegisterInputSchema", () => {
  it("accepts valid registration input", () => {
    const result = RegisterInputSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = RegisterInputSchema.safeParse({
      email: "alice@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = RegisterInputSchema.safeParse({
      name: "",
      email: "alice@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("rejects invalid email format", () => {
    const result = RegisterInputSchema.safeParse({
      name: "Alice",
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("rejects missing email", () => {
    const result = RegisterInputSchema.safeParse({
      name: "Alice",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = RegisterInputSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });

  it("rejects missing password", () => {
    const result = RegisterInputSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 8-character password", () => {
    const result = RegisterInputSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });
});

describe("LoginInputSchema", () => {
  it("accepts valid login input", () => {
    const result = LoginInputSchema.safeParse({
      email: "alice@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = LoginInputSchema.safeParse({ password: "anypassword" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = LoginInputSchema.safeParse({
      email: "bad-email",
      password: "anypassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("rejects missing password", () => {
    const result = LoginInputSchema.safeParse({ email: "alice@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = LoginInputSchema.safeParse({
      email: "alice@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });

  it("rejects completely empty object", () => {
    const result = LoginInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});
