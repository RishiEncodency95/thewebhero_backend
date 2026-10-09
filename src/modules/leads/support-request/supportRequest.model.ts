import { Schema, model, Document } from "mongoose";

export type LeadStatus = "new" | "in-progress" | "resolved" | "closed" | "spam";

export interface ISupportRequest extends Document {
  name: string;
  email: string;
  phone?: string;
  priority: "low" | "medium" | "high" | "urgent";
  subject: string;
  description: string;
  status: LeadStatus;
  createdAt: Date;
}

const supportRequestSchema = new Schema<ISupportRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved", "closed", "spam"],
      default: "new",
    },
  },
  { timestamps: true }
);

export const SupportRequest = model<ISupportRequest>("SupportRequest", supportRequestSchema);
