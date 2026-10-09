import { Schema, model, Document } from "mongoose";

export type LeadStatus = "new" | "in-progress" | "resolved" | "closed" | "spam";

export interface IContactEnquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: LeadStatus;
  source?: string;
  createdAt: Date;
}

const contactEnquirySchema = new Schema<IContactEnquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String },
    subject: { type: String },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved", "closed", "spam"],
      default: "new",
    },
    source: { type: String, default: "website" },
  },
  { timestamps: true }
);

export const ContactEnquiry = model<IContactEnquiry>("ContactEnquiry", contactEnquirySchema);
