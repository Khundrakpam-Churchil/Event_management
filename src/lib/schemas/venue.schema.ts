import { z } from "zod";

export const CreateVenueInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  capacity: z
    .number()
    .int("Capacity must be an integer")
    .positive("Capacity must be a positive integer"),
});

export type CreateVenueInput = z.infer<typeof CreateVenueInputSchema>;

export const UpdateVenueInputSchema = CreateVenueInputSchema.partial();

export type UpdateVenueInput = z.infer<typeof UpdateVenueInputSchema>;
