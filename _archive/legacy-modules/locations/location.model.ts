import { Schema, model, Document } from "mongoose";
import { autoSlug } from "../../common/utils/autoSlug";

// Local-SEO landing pages (e.g. /locations/city/mumbai, /locations/country/india)
// used for internal linking / programmatic SEO - NOT physical office addresses
// (those live in Settings: contactEmail/contactPhone/address).
export interface ILocation extends Document {
  name: string;
  type: "city" | "country" | "region";
  slug: string;
  status: "draft" | "published";
  order: number;
  seo: { title?: string; description?: string; ogImage?: string; keywords?: string[]; ogImageAlt?: string };
}

const locationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["city", "country", "region"], default: "city" },
    slug: { type: String, unique: true, lowercase: true },
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

locationSchema.plugin(autoSlug("name"));

export const Location = model<ILocation>("Location", locationSchema);
