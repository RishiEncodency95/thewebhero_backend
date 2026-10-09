import { z } from "zod";

export const createPartnerSchema = z.object({
  name: z.string().min(1).max(100),
  logo: z.string().url(),
  website: z.string().url().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
});

export const updatePartnerSchema = createPartnerSchema.partial();
