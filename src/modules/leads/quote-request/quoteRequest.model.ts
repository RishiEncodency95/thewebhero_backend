import { Schema, model, Document } from "mongoose";

export type LeadStatus = "new" | "in-progress" | "resolved" | "closed" | "spam";

export interface IQuoteRequest extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  budget?: string;
  services: string[];
  projectDetails: string;
  status: LeadStatus;
  createdAt: Date;
}

const quoteRequestSchema = new Schema<IQuoteRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String },
    company: { type: String },
    budget: { type: String },
    services: [{ type: String }],
    projectDetails: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved", "closed", "spam"],
      default: "new",
    },
  },
  { timestamps: true }
);

export const QuoteRequest = model<IQuoteRequest>("QuoteRequest", quoteRequestSchema);
