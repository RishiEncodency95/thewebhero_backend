import { Schema, model, Document } from "mongoose";
import { leadBaseDefinition, LeadBaseFields } from "../../../common/factories/leadFields";

export interface ISupportRequest extends Document, LeadBaseFields {
  name: string;
  email: string;
  phone?: string;
  priority: "low" | "medium" | "high" | "urgent";
  subject: string;
  description: string;
}

const supportRequestSchema = new Schema<ISupportRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    ...leadBaseDefinition,
  },
  { timestamps: true }
);

supportRequestSchema.index({ createdAt: -1 });

export const SupportRequest = model<ISupportRequest>("SupportRequest", supportRequestSchema);
