import { Schema, model, Document } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

export interface ICaseStudy extends Document {
  title: string;
  slug: string;
  client?: string;
  industry?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  coverImage?: string;
  images: string[];
  status: "draft" | "published";
  order: number;
  seo: { title?: string; description?: string; ogImage?: string; keywords?: string[]; ogImageAlt?: string };
}

const caseStudySchema = new Schema<ICaseStudy>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    client: { type: String },
    industry: { type: String },
    challenge: { type: String },
    solution: { type: String },
    results: { type: String },
    coverImage: { type: String },
    images: [{ type: String }],
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

caseStudySchema.plugin(autoSlug("title"));

export const CaseStudy = model<ICaseStudy>("CaseStudy", caseStudySchema);
