import { prisma } from "@/src/lib/prisma";
import { AppError } from "@/src/lib/errors";

export async function getTicketByCode(code: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode: code },
    include: {
      bookingItem: {
        include: {
          ticketType: { select: { id: true, name: true, price: true, eventId: true } },
          booking: { select: { id: true, userId: true, eventId: true, status: true } },
        },
      },
    },
  });

  if (!ticket) throw new AppError("TICKET_NOT_FOUND", "Ticket not found.", 404);
  return ticket;
}

export async function checkInTicket(
  code: string,
  requesterId: string,
  requesterRole: string
) {
  const ticket = await getTicketByCode(code);

  // Verify caller is the event organizer or Admin
  if (requesterRole !== "ADMIN") {
    const eventId = ticket.bookingItem.booking.eventId;
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.organizerId !== requesterId) {
      throw new AppError("FORBIDDEN", "Only the event organizer or an Admin can check in tickets.", 403);
    }
  }

  // Idempotency guard — already checked in
  if (ticket.checkedIn) {
    throw new AppError("TICKET_ALREADY_CHECKED_IN", "This ticket has already been checked in.", 409);
  }

  return prisma.ticket.update({
    where: { ticketCode: code },
    data: { checkedIn: true, checkedInAt: new Date() },
    include: {
      bookingItem: {
        include: {
          ticketType: { select: { id: true, name: true } },
          booking: { select: { id: true, eventId: true } },
        },
      },
    },
  });
}
