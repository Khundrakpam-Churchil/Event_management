import { prisma } from "@/src/lib/prisma";
import { AppError } from "@/src/lib/errors";
import type { CreateBookingInput } from "@/src/lib/schemas/booking.schema";
import type { PaginationMeta } from "@/src/lib/api/response";
import { createId } from "@paralleldrive/cuid2";

const REFUND_WINDOW_HOURS = Number(process.env.REFUND_WINDOW_HOURS ?? "24");

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

const bookingInclude = {
  event: { select: { id: true, title: true, startDateTime: true, status: true } },
  bookingItems: {
    include: {
      ticketType: { select: { id: true, name: true, price: true } },
      tickets: true,
    },
  },
  payment: true,
} as const;

export async function createBooking(input: CreateBookingInput, userId: string) {
  // Idempotency check — return existing booking if key already used
  if (input.idempotencyKey) {
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: bookingInclude,
    });
    if (existing) return existing;
  }

  return prisma.$transaction(async (tx) => {
    // 1. Verify event is PUBLISHED
    const event = await tx.event.findFirst({
      where: { id: input.eventId, deletedAt: null },
    });
    if (!event) throw new AppError("EVENT_NOT_FOUND", "Event not found.", 404);
    if (event.status !== "PUBLISHED") {
      throw new AppError("EVENT_NOT_BOOKABLE", "This event is not available for booking.", 422);
    }

    const now = new Date();
    let totalAmount = 0;

    // 2. Lock and validate each ticket type row
    const itemsData: Array<{
      ticketTypeId: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const item of input.items) {
      // Raw SELECT FOR UPDATE to lock the row
      const [ticketType] = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          price: string;
          totalQuantity: number;
          quantitySold: number;
          salesStart: Date;
          salesEnd: Date;
          deletedAt: Date | null;
        }>
      >`
        SELECT id, name, price, "totalQuantity", "quantitySold", "salesStart", "salesEnd", "deletedAt"
        FROM "TicketType"
        WHERE id = ${item.ticketTypeId}
        FOR UPDATE
      `;

      if (!ticketType || ticketType.deletedAt) {
        throw new AppError("TICKET_TYPE_NOT_FOUND", `Ticket type ${item.ticketTypeId} not found.`, 404);
      }

      // Sales window check
      if (now < ticketType.salesStart || now > ticketType.salesEnd) {
        throw new AppError("TICKET_SALES_CLOSED", `Ticket sales for "${ticketType.name}" are not currently active.`, 422);
      }

      // Inventory check
      const available = ticketType.totalQuantity - ticketType.quantitySold;
      if (item.quantity > available) {
        throw new AppError(
          "INSUFFICIENT_INVENTORY",
          `Only ${available} ticket(s) available for "${ticketType.name}".`,
          409
        );
      }

      const unitPrice = Number(ticketType.price);
      totalAmount += unitPrice * item.quantity;
      itemsData.push({ ticketTypeId: item.ticketTypeId, quantity: item.quantity, unitPrice });
    }

    // 3. Create Booking
    const booking = await tx.booking.create({
      data: {
        userId,
        eventId: input.eventId,
        status: "CONFIRMED",
        totalAmount,
        idempotencyKey: input.idempotencyKey ?? null,
      },
    });

    // 4. Create BookingItems + Tickets, increment quantitySold
    for (const item of itemsData) {
      const bookingItem = await tx.bookingItem.create({
        data: {
          bookingId: booking.id,
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      });

      // One Ticket record per unit
      for (let i = 0; i < item.quantity; i++) {
        await tx.ticket.create({
          data: {
            bookingItemId: bookingItem.id,
            ticketCode: createId(),
            checkedIn: false,
          },
        });
      }

      // Increment quantitySold
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { quantitySold: { increment: item.quantity } },
      });
    }

    // 5. Create Payment record (PENDING — real payment processed externally)
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        provider: "stripe",
        status: "PENDING",
      },
    });

    // 6. Return full booking
    return tx.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: bookingInclude,
    });
  });
}

export async function cancelBooking(
  bookingId: string,
  requesterId: string,
  requesterRole: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { bookingItems: true, payment: true },
  });

  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);

  if (requesterRole !== "ADMIN" && booking.userId !== requesterId) {
    throw new AppError("FORBIDDEN", "You do not have permission to cancel this booking.", 403);
  }

  if (booking.status !== "CONFIRMED") {
    throw new AppError("VALIDATION_ERROR", "Only CONFIRMED bookings can be cancelled.", 422);
  }

  // Refund window check
  const windowMs = REFUND_WINDOW_HOURS * 60 * 60 * 1000;
  const elapsed = Date.now() - booking.createdAt.getTime();
  if (elapsed > windowMs) {
    throw new AppError(
      "REFUND_WINDOW_EXPIRED",
      `Cancellations are only allowed within ${REFUND_WINDOW_HOURS} hours of booking.`,
      422
    );
  }

  return prisma.$transaction(async (tx) => {
    // Restore inventory
    for (const item of booking.bookingItems) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { quantitySold: { decrement: item.quantity } },
      });
    }

    // Update booking and payment status
    await tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

    if (booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: "REFUNDED" },
      });
    }

    return tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: bookingInclude,
    });
  });
}

export async function getUserBookings(
  userId: string,
  requesterRole: string,
  page = 1,
  limit = 20,
  filterUserId?: string
) {
  const skip = (page - 1) * limit;

  // Admin can filter by any userId; regular users only see their own
  const whereUserId = requesterRole === "ADMIN" && filterUserId ? filterUserId : userId;

  const where = requesterRole === "ADMIN" && !filterUserId ? {} : { userId: whereUserId };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: bookingInclude,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getBookingById(
  bookingId: string,
  requesterId: string,
  requesterRole: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });

  if (!booking) throw new AppError("BOOKING_NOT_FOUND", "Booking not found.", 404);

  if (requesterRole !== "ADMIN" && booking.userId !== requesterId) {
    throw new AppError("FORBIDDEN", "You do not have permission to view this booking.", 403);
  }

  return booking;
}
