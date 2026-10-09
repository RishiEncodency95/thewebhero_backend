import { z } from "zod";

export const updateHomePageSchema = z.object({
  hero: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      image: z.string().url().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
    })
    .optional(),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  sections: z
    .array(
      z.object({
        type: z.string(),
        title: z.string(),
        content: z.string().optional(),
        items: z.array(z.unknown()).optional(),
      })
    )
    .optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().url().optional(),
    })
    .optional(),
});

export type UpdateHomePageInput = z.infer<typeof updateHomePageSchema>;
