import { z } from "zod";

export const createTechnologySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  category: z.enum(["frontend", "backend", "database", "devops", "mobile", "other"]).default("other"),
  logo: z.string().url().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
});

export const updateTechnologySchema = createTechnologySchema.partial();
