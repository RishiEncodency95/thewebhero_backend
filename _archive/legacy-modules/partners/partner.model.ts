import { Schema, model, Document } from "mongoose";

export interface IPartner extends Document {
  name: string;
  logo: string;
  website?: string;
  status: "draft" | "published";
  order: number;
}

const partnerSchema = new Schema<IPartner>(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true },
    website: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Partner = model<IPartner>("Partner", partnerSchema);
