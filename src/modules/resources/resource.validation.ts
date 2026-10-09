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

export const createResourceSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().optional(),
  type: z.enum(["ebook", "whitepaper", "template", "webinar", "case-study", "other"]).default("other"),
  fileUrl: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  seo: seoSchema,
});

export const updateResourceSchema = createResourceSchema.partial();
