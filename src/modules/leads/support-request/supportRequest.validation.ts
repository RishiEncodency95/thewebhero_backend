import { z } from "zod";
import { leadPublicFields, optionalText } from "../../../common/factories/leadFields";

export const createSupportRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: optionalText(30),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  subject: z.string().trim().min(2).max(200),
  description: z.string().trim().min(5).max(5000),
  ...leadPublicFields,
});
