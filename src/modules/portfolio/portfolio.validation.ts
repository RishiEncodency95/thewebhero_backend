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

export const createPortfolioSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().optional(),
  client: z.string().optional(),
  category: z.string().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  description: z.string().default(""),
  technologies: z.array(z.string()).default([]),
  projectUrl: z.string().url().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
  seo: seoSchema,
});

export const updatePortfolioSchema = createPortfolioSchema.partial();
