import { Schema, model, Document } from "mongoose";
import { leadBaseDefinition, LeadBaseFields } from "../../../common/factories/leadFields";

// Mirrors the 5-step quote form on the website (twh_frontend/app/types/quote.ts).
export interface IQuoteRequest extends Document, LeadBaseFields {
  // Step 1: contact
  fullName: string;
  companyName?: string;
  email: string;
  phone?: string;
  country?: string;
  preferredContactMethod: "Email" | "Phone" | "WhatsApp";
  // Step 2: project
  service: string;
  projectType?: string;
  industry?: string;
  existingUrl?: string;
  projectStatus?: "New Project" | "Existing Product Modernization" | "Maintenance / Support";
  // Step 3: requirements
  summary: string;
  goals?: string;
  features: string[];
  platforms: string[];
  technologyPreferences: string[];
  referenceLinks?: string;
  // Step 4: budget & timeline
  budget?: string;
  timeline?: string;
  priority: "Standard" | "Urgent" | "Flexible";
  preferredStartDate?: string;
  // Step 5: extras
  additionalNotes?: string;
  attachmentName?: string;
  consent: boolean;
}

const quoteRequestSchema = new Schema<IQuoteRequest>(
  {
    fullName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    country: { type: String, trim: true },
    preferredContactMethod: { type: String, enum: ["Email", "Phone", "WhatsApp"], default: "Email" },

    service: { type: String, required: true, trim: true },
    projectType: { type: String, trim: true },
    industry: { type: String, trim: true },
    existingUrl: { type: String, trim: true },
    projectStatus: {
      type: String,
      enum: ["New Project", "Existing Product Modernization", "Maintenance / Support"],
    },

    summary: { type: String, required: true },
    goals: { type: String },
    features: [{ type: String }],
    platforms: [{ type: String }],
    technologyPreferences: [{ type: String }],
    referenceLinks: { type: String },

    budget: { type: String },
    timeline: { type: String },
    priority: { type: String, enum: ["Standard", "Urgent", "Flexible"], default: "Standard" },
    preferredStartDate: { type: String },

    additionalNotes: { type: String },
    attachmentName: { type: String },
    consent: { type: Boolean, required: true },

    ...leadBaseDefinition,
  },
  { timestamps: true }
);

quoteRequestSchema.index({ createdAt: -1 });

export const QuoteRequest = model<IQuoteRequest>("QuoteRequest", quoteRequestSchema);
