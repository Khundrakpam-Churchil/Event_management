import { z } from "zod";

export const BookingItemInputSchema = z.object({
  ticketTypeId: z.string().min(1, "Ticket type ID is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be a positive integer"),
});

export type BookingItemInput = z.infer<typeof BookingItemInputSchema>;

export const CreateBookingInputSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  items: z
    .array(BookingItemInputSchema)
    .min(1, "At least one booking item is required"),
  idempotencyKey: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;
