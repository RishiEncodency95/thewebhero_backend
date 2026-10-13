import { Schema, model, Document } from "mongoose";
import { leadBaseDefinition, LeadBaseFields } from "../../../common/factories/leadFields";

export interface IContactEnquiry extends Document, LeadBaseFields {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  subject?: string;
  message: string;
  consent: boolean;
  source?: string;
}

const contactEnquirySchema = new Schema<IContactEnquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    service: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true },
    consent: { type: Boolean, default: false },
    source: { type: String, default: "website" },
    ...leadBaseDefinition,
  },
  { timestamps: true }
);

contactEnquirySchema.index({ createdAt: -1 });

export const ContactEnquiry = model<IContactEnquiry>("ContactEnquiry", contactEnquirySchema);
