import { prisma } from "@/src/lib/prisma";
import { AppError } from "@/src/lib/errors";
import type { CreateEventInput, UpdateEventInput, EventFilters } from "@/src/lib/schemas/event.schema";
import type { PaginationMeta } from "@/src/lib/api/response";
import { Prisma } from "@prisma/client";

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

type RequesterRole = "USER" | "ORGANIZER" | "ADMIN" | undefined;

function buildEventWhere(
  filters: EventFilters,
  requesterRole?: RequesterRole
): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {};

  // Non-admins only see PUBLISHED, non-deleted events
  if (requesterRole !== "ADMIN") {
    where.status = "PUBLISHED";
    where.deletedAt = null;
  } else if (filters.status) {
    where.status = filters.status;
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = { name: { equals: filters.category, mode: "insensitive" } };
  }

  if (filters.city) {
    where.venue = { city: { equals: filters.city, mode: "insensitive" } };
  }

  if (filters.startDate) {
    where.startDateTime = { gte: new Date(filters.startDate) };
  }

  if (filters.endDate) {
    where.endDateTime = { lte: new Date(filters.endDate) };
  }

  return where;
}

function buildEventOrderBy(sort?: string): Prisma.EventOrderByWithRelationInput {
  if (!sort) return { startDateTime: "asc" };
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  const direction = desc ? "desc" : "asc";

  const allowed = ["startDateTime", "endDateTime", "title", "createdAt"];
  if (!allowed.includes(field)) return { startDateTime: "asc" };

  return { [field]: direction } as Prisma.EventOrderByWithRelationInput;
}

const eventInclude = {
  venue: true,
  category: true,
  organizer: { select: { id: true, name: true, email: true } },
  ticketTypes: {
    where: { deletedAt: null },
    orderBy: { price: "asc" as const },
  },
} satisfies Prisma.EventInclude;

export async function listEvents(
  filters: EventFilters,
  requesterRole?: RequesterRole
): Promise<PaginatedResult<object>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = buildEventWhere(filters, requesterRole);
  const orderBy = buildEventOrderBy(filters.sort);

  const [events, total] = await Promise.all([
    prisma.event.findMany({ where, skip, take: limit, orderBy, include: eventInclude }),
    prisma.event.count({ where }),
  ]);

  return {
    data: events,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getEventById(id: string, requesterRole?: RequesterRole) {
  const where: Prisma.EventWhereInput =
    requesterRole === "ADMIN" ? { id } : { id, deletedAt: null, status: "PUBLISHED" };

  const event = await prisma.event.findFirst({ where, include: eventInclude });

  if (!event) {
    throw new AppError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  return event;
}

export async function createEvent(data: CreateEventInput, organizerId: string) {
  return prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      venueId: data.venueId,
      organizerId,
      startDateTime: new Date(data.startDateTime),
      endDateTime: new Date(data.endDateTime),
      bannerImageUrl: data.bannerImageUrl,
      status: "DRAFT",
    },
    include: eventInclude,
  });
}

export async function updateEvent(
  id: string,
  data: UpdateEventInput,
  requesterId: string,
  requesterRole: string
) {
  // Fetch event without status restriction so organizer can update their DRAFT events
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });

  if (!event) {
    throw new AppError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  if (requesterRole !== "ADMIN" && event.organizerId !== requesterId) {
    throw new AppError("FORBIDDEN", "You do not have permission to update this event.", 403);
  }

  return prisma.event.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.venueId && { venueId: data.venueId }),
      ...(data.startDateTime && { startDateTime: new Date(data.startDateTime) }),
      ...(data.endDateTime && { endDateTime: new Date(data.endDateTime) }),
      ...(data.bannerImageUrl !== undefined && { bannerImageUrl: data.bannerImageUrl }),
      ...(data.status && { status: data.status }),
    },
    include: eventInclude,
  });
}

export async function softDeleteEvent(
  id: string,
  requesterId: string,
  requesterRole: string
) {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });

  if (!event) {
    throw new AppError("EVENT_NOT_FOUND", "Event not found.", 404);
  }

  if (requesterRole !== "ADMIN" && event.organizerId !== requesterId) {
    throw new AppError("FORBIDDEN", "You do not have permission to delete this event.", 403);
  }

  await prisma.event.update({
    where: { id },
    data: { deletedAt: new Date(), status: "CANCELLED" },
  });
}
