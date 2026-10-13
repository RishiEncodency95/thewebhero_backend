import { z } from "zod";

export const createFaqSchema = z.object({
  question: z.string().min(3).max(300),
  answer: z.string().min(3),
  category: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
});

export const updateFaqSchema = createFaqSchema.partial();
