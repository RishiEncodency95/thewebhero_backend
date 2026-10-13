import { z } from "zod";

const seoSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().url().optional(),
    keywords: z.array(z.string()).optional(),
    ogImageAlt: z.string().optional(),
  })
  .optional();

export const createLocationSchema = z.object({
  name: z.string().min(1).max(150),
  type: z.enum(["city", "country", "region"]).default("city"),
  slug: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
  seo: seoSchema,
});

export const updateLocationSchema = createLocationSchema.partial();
