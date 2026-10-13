import { Schema, model, Document } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

export interface IPortfolio extends Document {
  title: string;
  slug: string;
  client?: string;
  category?: string;
  coverImage?: string;
  images: string[];
  description: string;
  technologies: string[];
  projectUrl?: string;
  status: "draft" | "published";
  order: number;
  seo: { title?: string; description?: string; ogImage?: string; keywords?: string[]; ogImageAlt?: string };
}

const portfolioSchema = new Schema<IPortfolio>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    client: { type: String },
    category: { type: String },
    coverImage: { type: String },
    images: [{ type: String }],
    description: { type: String, default: "" },
    technologies: [{ type: String }],
    projectUrl: { type: String },
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

portfolioSchema.plugin(autoSlug("title"));

export const Portfolio = model<IPortfolio>("Portfolio", portfolioSchema);
