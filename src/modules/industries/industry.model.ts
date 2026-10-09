import { Schema, model, Document } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

export interface IIndustry extends Document {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  image?: string;
  status: "draft" | "published";
  order: number;
}

const industrySchema = new Schema<IIndustry>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    icon: { type: String },
    description: { type: String },
    image: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

industrySchema.plugin(autoSlug("name"));

export const Industry = model<IIndustry>("Industry", industrySchema);
