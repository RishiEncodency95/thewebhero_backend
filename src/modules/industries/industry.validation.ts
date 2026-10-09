import { z } from "zod";

export const createIndustrySchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
});

export const updateIndustrySchema = createIndustrySchema.partial();
