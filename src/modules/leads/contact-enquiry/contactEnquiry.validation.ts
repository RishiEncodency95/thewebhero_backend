import { z } from "zod";

export const createContactEnquirySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(5).max(2000),
  source: z.string().optional(),
});
