// Feature: event-ticket-management
// Unit tests for booking service business logic (Requirements 6.1–6.12, 14.5)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/src/lib/errors";

// ---------------------------------------------------------------------------
// Mock Prisma so these tests run without a real DB
// ---------------------------------------------------------------------------
vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    booking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    bookingItem: { create: vi.fn() },
    ticket: { create: vi.fn() },
    ticketType: { update: vi.fn() },
    payment: { create: vi.fn(), update: vi.fn() },
    event: { findFirst: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: () => "test-ticket-code-" + Math.random().toString(36).slice(2),
}));

import { prisma } from "@/src/lib/prisma";
import { cancelBooking, getBookingById, getUserBookings } from "../booking.service";

const mockPrisma = prisma as unknown as {
  booking: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  event: { findFirst: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// cancelBooking
// ---------------------------------------------------------------------------
describe("cancelBooking", () => {
  it("throws BOOKING_NOT_FOUND when booking does not exist", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    await expect(cancelBooking("nonexistent", "user1", "USER")).rejects.toMatchObject({
      code: "BOOKING_NOT_FOUND",
      httpStatus: 404,
    });
  });

  it("throws FORBIDDEN when non-owner non-admin tries to cancel", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "b1",
      userId: "owner-user",
      status: "CONFIRMED",
      createdAt: new Date(),
      bookingItems: [],
      payment: null,
    });

    await expect(cancelBooking("b1", "other-user", "USER")).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });
  });

  it("throws VALIDATION_ERROR when booking is not CONFIRMED", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "b1",
      userId: "user1",
      status: "CANCELLED",
      createdAt: new Date(),
      bookingItems: [],
      payment: null,
    });

    await expect(cancelBooking("b1", "user1", "USER")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("throws REFUND_WINDOW_EXPIRED when outside the refund window", async () => {
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "b1",
      userId: "user1",
      status: "CONFIRMED",
      createdAt: oldDate,
      bookingItems: [{ ticketTypeId: "tt1", quantity: 2 }],
      payment: { id: "p1", status: "PENDING" },
    });

    await expect(cancelBooking("b1", "user1", "USER")).rejects.toMatchObject({
      code: "REFUND_WINDOW_EXPIRED",
      httpStatus: 422,
    });
  });
});

// ---------------------------------------------------------------------------
// getBookingById
// ---------------------------------------------------------------------------
describe("getBookingById", () => {
  it("throws BOOKING_NOT_FOUND when booking does not exist", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    await expect(getBookingById("nonexistent", "user1", "USER")).rejects.toMatchObject({
      code: "BOOKING_NOT_FOUND",
      httpStatus: 404,
    });
  });

  it("throws FORBIDDEN when non-owner tries to view booking", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "b1",
      userId: "owner",
      status: "CONFIRMED",
      bookingItems: [],
      payment: null,
      event: {},
    });

    await expect(getBookingById("b1", "other", "USER")).rejects.toMatchObject({
      code: "FORBIDDEN",
      httpStatus: 403,
    });
  });

  it("Admin can view any booking", async () => {
    const booking = {
      id: "b1",
      userId: "some-user",
      status: "CONFIRMED",
      bookingItems: [],
      payment: null,
      event: {},
    };
    mockPrisma.booking.findUnique.mockResolvedValue(booking);

    const result = await getBookingById("b1", "admin-id", "ADMIN");
    expect(result).toEqual(booking);
  });

  it("owner can view their own booking", async () => {
    const booking = {
      id: "b1",
      userId: "user1",
      status: "CONFIRMED",
      bookingItems: [],
      payment: null,
      event: {},
    };
    mockPrisma.booking.findUnique.mockResolvedValue(booking);

    const result = await getBookingById("b1", "user1", "USER");
    expect(result).toEqual(booking);
  });
});

// ---------------------------------------------------------------------------
// getUserBookings
// ---------------------------------------------------------------------------
describe("getUserBookings", () => {
  it("returns paginated bookings for current user", async () => {
    const mockBookings = [{ id: "b1" }, { id: "b2" }];
    mockPrisma.booking.findMany.mockResolvedValue(mockBookings);
    mockPrisma.booking.count.mockResolvedValue(2);

    const result = await getUserBookings("user1", "USER", 1, 20);
    expect(result.data).toEqual(mockBookings);
    expect(result.meta.total).toBe(2);
    expect(result.meta.totalPages).toBe(1);
  });

  it("calculates totalPages correctly", async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.booking.count.mockResolvedValue(45);

    const result = await getUserBookings("user1", "ADMIN", 1, 20);
    expect(result.meta.totalPages).toBe(3); // ceil(45/20) = 3
    expect(result.meta.total).toBe(45);
  });
});

// ---------------------------------------------------------------------------
// AppError class
// ---------------------------------------------------------------------------
describe("AppError", () => {
  it("carries code, message, and httpStatus", () => {
    const err = new AppError("TEST_CODE", "test message", 418);
    expect(err.code).toBe("TEST_CODE");
    expect(err.message).toBe("test message");
    expect(err.httpStatus).toBe(418);
    expect(err instanceof Error).toBe(true);
  });

  it("isAppError correctly identifies AppError instances", () => {
    const err = new AppError("X", "y", 400);
    expect(AppError.isAppError(err)).toBe(true);
    expect(AppError.isAppError(new Error("plain"))).toBe(false);
    expect(AppError.isAppError("string")).toBe(false);
    expect(AppError.isAppError(null)).toBe(false);
  });
});
