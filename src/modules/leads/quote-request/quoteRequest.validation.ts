import { z } from "zod";
import { leadPublicFields, optionalText, stringList } from "../../../common/factories/leadFields";

// Public quote form payload - field names match twh_frontend/app/types/quote.ts.
export const createQuoteRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  companyName: optionalText(150),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: optionalText(30),
  country: optionalText(80),
  preferredContactMethod: z.enum(["Email", "Phone", "WhatsApp"]).default("Email"),

  service: z.string().trim().min(1).max(150),
  projectType: optionalText(150),
  industry: optionalText(150),
  existingUrl: optionalText(500),
  projectStatus: z.enum(["New Project", "Existing Product Modernization", "Maintenance / Support"]).optional(),

  summary: z.string().trim().min(15).max(5000),
  goals: optionalText(3000),
  features: stringList(),
  platforms: stringList(),
  technologyPreferences: stringList(),
  referenceLinks: optionalText(2000),

  budget: optionalText(80),
  timeline: optionalText(80),
  priority: z.enum(["Standard", "Urgent", "Flexible"]).default("Standard"),
  preferredStartDate: optionalText(40),

  additionalNotes: optionalText(5000),
  attachmentName: optionalText(255),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required" }) }),

  ...leadPublicFields,
});
