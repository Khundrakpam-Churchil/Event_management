import { z } from "zod";

export const CreateCategoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;

export const UpdateCategoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;
