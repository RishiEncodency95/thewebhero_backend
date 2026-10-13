import { Schema, model, Document, Types } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  author: Types.ObjectId;
  category?: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt?: Date;
  seo: { title?: string; description?: string; ogImage?: string; keywords?: string[]; ogImageAlt?: string };
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    excerpt: { type: String },
    content: { type: String, required: true },
    coverImage: { type: String },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String },
    tags: [{ type: String }],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
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

blogSchema.plugin(autoSlug("title"));
blogSchema.index({ title: "text", content: "text" });

export const Blog = model<IBlog>("Blog", blogSchema);
