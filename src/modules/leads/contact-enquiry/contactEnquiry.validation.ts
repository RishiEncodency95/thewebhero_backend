import { z } from "zod";
import { leadPublicFields, optionalText } from "../../../common/factories/leadFields";

export const createContactEnquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: optionalText(30),
  company: optionalText(150),
  service: optionalText(150),
  subject: optionalText(200),
  message: z.string().trim().min(5).max(5000),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required" }) }),
  source: optionalText(80),
  ...leadPublicFields,
});
