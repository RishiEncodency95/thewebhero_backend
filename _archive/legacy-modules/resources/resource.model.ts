import { Schema, model, Document } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

export interface IResourceItem extends Document {
  title: string;
  slug: string;
  type: "ebook" | "whitepaper" | "template" | "webinar" | "case-study" | "other";
  fileUrl?: string;
  coverImage?: string;
  description?: string;
  downloadsCount: number;
  status: "draft" | "published";
  seo: { title?: string; description?: string; ogImage?: string; keywords?: string[]; ogImageAlt?: string };
}

const resourceSchema = new Schema<IResourceItem>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    type: {
      type: String,
      enum: ["ebook", "whitepaper", "template", "webinar", "case-study", "other"],
      default: "other",
    },
    fileUrl: { type: String },
    coverImage: { type: String },
    description: { type: String },
    downloadsCount: { type: Number, default: 0 },
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

resourceSchema.plugin(autoSlug("title"));

export const ResourceItem = model<IResourceItem>("Resource", resourceSchema);
