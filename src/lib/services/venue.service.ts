import { prisma } from "@/src/lib/prisma";
import { AppError } from "@/src/lib/errors";
import type { CreateVenueInput, UpdateVenueInput } from "@/src/lib/schemas/venue.schema";
import type { PaginationMeta } from "@/src/lib/api/response";

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export async function listVenues(
  page = 1,
  limit = 20
): Promise<PaginatedResult<object>> {
  const skip = (page - 1) * limit;

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.venue.count({ where: { deletedAt: null } }),
  ]);

  return {
    data: venues,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getVenueById(id: string) {
  const venue = await prisma.venue.findFirst({
    where: { id, deletedAt: null },
  });

  if (!venue) {
    throw new AppError("VENUE_NOT_FOUND", "Venue not found.", 404);
  }

  return venue;
}

export async function createVenue(data: CreateVenueInput) {
  return prisma.venue.create({ data });
}

export async function updateVenue(id: string, data: UpdateVenueInput) {
  await getVenueById(id); // throws if not found

  return prisma.venue.update({
    where: { id },
    data,
  });
}

export async function softDeleteVenue(id: string) {
  await getVenueById(id); // throws if not found

  await prisma.venue.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
