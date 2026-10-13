import { z } from "zod";

export const createAwardSchema = z.object({
  title: z.string().min(1).max(200),
  organization: z.string().optional(),
  year: z.number().min(1990).max(2100),
  image: z.string().url().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
});

export const updateAwardSchema = createAwardSchema.partial();
