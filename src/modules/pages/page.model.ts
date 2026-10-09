import { Schema, model, Document } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

export interface IPage extends Document {
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  seo: { title?: string; description?: string; ogImage?: string; keywords?: string[]; ogImageAlt?: string };
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<IPage>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    content: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
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

pageSchema.plugin(autoSlug("title"));

export const Page = model<IPage>("Page", pageSchema);
