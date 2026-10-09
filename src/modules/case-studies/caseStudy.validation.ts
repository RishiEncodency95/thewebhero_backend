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

export const createCaseStudySchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().optional(),
  client: z.string().optional(),
  industry: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  results: z.string().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
  seo: seoSchema,
});

export const updateCaseStudySchema = createCaseStudySchema.partial();
