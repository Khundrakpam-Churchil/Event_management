import { z } from "zod";

export const CreateTicketTypeInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z
    .number()
    .positive("Price must be a positive number")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal").transform(Number)),
  totalQuantity: z
    .number()
    .int("Total quantity must be an integer")
    .positive("Total quantity must be a positive integer"),
  salesStart: z.string().datetime({ message: "salesStart must be a valid ISO datetime" }),
  salesEnd: z.string().datetime({ message: "salesEnd must be a valid ISO datetime" }),
});

export type CreateTicketTypeInput = z.infer<typeof CreateTicketTypeInputSchema>;

export const UpdateTicketTypeInputSchema = CreateTicketTypeInputSchema.partial();

export type UpdateTicketTypeInput = z.infer<typeof UpdateTicketTypeInputSchema>;
