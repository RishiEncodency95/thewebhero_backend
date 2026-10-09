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

export const createBlogSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(10),
  coverImage: z.string().url().optional(),
  author: z.string().min(1, "Author is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  seo: seoSchema,
});

export const updateBlogSchema = createBlogSchema.partial();
