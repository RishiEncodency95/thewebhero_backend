import { z } from "zod";

export const createTestimonialSchema = z.object({
  clientName: z.string().min(1).max(100),
  clientDesignation: z.string().optional(),
  clientCompany: z.string().optional(),
  clientPhoto: z.string().url().optional(),
  rating: z.number().min(1).max(5).default(5),
  message: z.string().min(5),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();
