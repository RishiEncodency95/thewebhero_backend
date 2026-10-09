import { Schema, model, Document } from "mongoose";

export interface IAward extends Document {
  title: string;
  organization?: string;
  year: number;
  image?: string;
  description?: string;
  status: "draft" | "published";
  order: number;
}

const awardSchema = new Schema<IAward>(
  {
    title: { type: String, required: true, trim: true },
    organization: { type: String },
    year: { type: Number, required: true },
    image: { type: String },
    description: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Award = model<IAward>("Award", awardSchema);
