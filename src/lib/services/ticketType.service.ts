import { prisma } from "@/src/lib/prisma";
import { AppError } from "@/src/lib/errors";
import type { CreateTicketTypeInput, UpdateTicketTypeInput } from "@/src/lib/schemas/ticketType.schema";

type RequesterRole = "USER" | "ORGANIZER" | "ADMIN";

/** Ensure the event exists and the requester owns it (or is Admin). */
async function assertEventAccess(eventId: string, requesterId: string, requesterRole: RequesterRole) {
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
  if (!event) throw new AppError("EVENT_NOT_FOUND", "Event not found.", 404);
  if (requesterRole !== "ADMIN" && event.organizerId !== requesterId) {
    throw new AppError("FORBIDDEN", "You do not have permission to manage ticket types for this event.", 403);
  }
  return event;
}

export async function listTicketTypes(eventId: string) {
  // Verify event exists publicly
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
  if (!event) throw new AppError("EVENT_NOT_FOUND", "Event not found.", 404);

  return prisma.ticketType.findMany({
    where: { eventId, deletedAt: null },
    orderBy: { price: "asc" },
  });
}

export async function getTicketTypeById(id: string) {
  const tt = await prisma.ticketType.findFirst({ where: { id, deletedAt: null } });
  if (!tt) throw new AppError("TICKET_TYPE_NOT_FOUND", "Ticket type not found.", 404);
  return tt;
}

export async function createTicketType(
  eventId: string,
  data: CreateTicketTypeInput,
  requesterId: string,
  requesterRole: RequesterRole
) {
  await assertEventAccess(eventId, requesterId, requesterRole);

  return prisma.ticketType.create({
    data: {
      eventId,
      name: data.name,
      price: data.price,
      totalQuantity: data.totalQuantity,
      quantitySold: 0,
      salesStart: new Date(data.salesStart),
      salesEnd: new Date(data.salesEnd),
    },
  });
}

export async function updateTicketType(
  id: string,
  data: UpdateTicketTypeInput,
  requesterId: string,
  requesterRole: RequesterRole
) {
  const tt = await getTicketTypeById(id);
  await assertEventAccess(tt.eventId, requesterId, requesterRole);

  return prisma.ticketType.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.totalQuantity !== undefined && { totalQuantity: data.totalQuantity }),
      ...(data.salesStart !== undefined && { salesStart: new Date(data.salesStart) }),
      ...(data.salesEnd !== undefined && { salesEnd: new Date(data.salesEnd) }),
    },
  });
}

export async function softDeleteTicketType(
  id: string,
  requesterId: string,
  requesterRole: RequesterRole
) {
  const tt = await getTicketTypeById(id);
  await assertEventAccess(tt.eventId, requesterId, requesterRole);

  await prisma.ticketType.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
