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

export const createPageSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().optional(),
  content: z.string().default(""),
  status: z.enum(["draft", "published"]).default("draft"),
  seo: seoSchema,
});

export const updatePageSchema = createPageSchema.partial();
