import { z } from "zod";

// Mirrors the Prisma EventStatus enum
export const EventStatusSchema = z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]);
export type EventStatus = z.infer<typeof EventStatusSchema>;

export const CreateEventInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  venueId: z.string().min(1, "Venue is required"),
  startDateTime: z.string().datetime({ message: "startDateTime must be a valid ISO datetime" }),
  endDateTime: z.string().datetime({ message: "endDateTime must be a valid ISO datetime" }),
  bannerImageUrl: z.string().url("Invalid banner image URL").optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export const UpdateEventInputSchema = CreateEventInputSchema.partial().extend({
  status: EventStatusSchema.optional(),
});

export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;

export const EventFiltersSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  status: EventStatusSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type EventFilters = z.infer<typeof EventFiltersSchema>;
