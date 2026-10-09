import { z } from "zod";

export const createSupportRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  subject: z.string().min(2).max(200),
  description: z.string().min(5).max(3000),
});
