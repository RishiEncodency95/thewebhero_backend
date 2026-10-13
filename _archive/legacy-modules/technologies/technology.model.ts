import { Schema, model, Document } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

export interface ITechnology extends Document {
  name: string;
  slug: string;
  category?: "frontend" | "backend" | "database" | "devops" | "mobile" | "other";
  logo?: string;
  status: "draft" | "published";
  order: number;
}

const technologySchema = new Schema<ITechnology>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    category: {
      type: String,
      enum: ["frontend", "backend", "database", "devops", "mobile", "other"],
      default: "other",
    },
    logo: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

technologySchema.plugin(autoSlug("name"));

export const Technology = model<ITechnology>("Technology", technologySchema);
