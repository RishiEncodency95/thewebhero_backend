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

export const createServiceSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().optional(),
  icon: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().default(""),
  image: z.string().url().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
  seo: seoSchema,
});

export const updateServiceSchema = createServiceSchema.partial();
