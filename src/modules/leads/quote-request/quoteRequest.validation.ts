import { z } from "zod";

export const createQuoteRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  budget: z.string().optional(),
  services: z.array(z.string()).default([]),
  projectDetails: z.string().min(5).max(3000),
});
