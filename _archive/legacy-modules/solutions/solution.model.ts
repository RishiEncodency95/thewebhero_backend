import { Schema, model, Document } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

export interface ISolution extends Document {
  title: string;
  slug: string;
  icon?: string;
  description: string;
  image?: string;
  status: "draft" | "published";
  order: number;
  seo: { title?: string; description?: string; ogImage?: string; keywords?: string[]; ogImageAlt?: string };
}

const solutionSchema = new Schema<ISolution>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    icon: { type: String },
    description: { type: String, default: "" },
    image: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
    seo: {
      title: { type: String },
      description: { type: String },
      ogImage: { type: String },
      keywords: [{ type: String }],
      ogImageAlt: { type: String },
    },
  },
  { timestamps: true }
);

solutionSchema.plugin(autoSlug("title"));

export const Solution = model<ISolution>("Solution", solutionSchema);
