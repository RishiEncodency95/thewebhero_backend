import { Schema } from "mongoose";
import { z } from "zod";
import { FieldMap, f } from "./fields";

// The on-page SEO block every page and content item carries. Empty values
// fall back on the website to the item's own title/description and then to
// the site-wide defaults in Settings.
export const seoFields: FieldMap = {
  title: f.text({ label: "Meta title", max: 120, help: "Shown in Google results. Aim for 50–60 characters; longer titles get cut off." }),
  description: f.textarea({ label: "Meta description", max: 320, rows: 3, help: "Aim for 140–160 characters; longer text gets cut off." }),
  focusKeyword: f.text({ label: "Focus keyword", max: 80, help: "Main search phrase this page should rank for." }),
  keywords: f.stringList({ label: "Keywords", max: 20, itemMax: 80 }),
  canonical: f.url({ label: "Canonical URL", help: "Leave empty to use this page's own URL." }),
  ogTitle: f.text({ label: "Social share title", max: 120 }),
  ogDescription: f.textarea({ label: "Social share description", max: 300, rows: 2 }),
  ogImage: f.image({ label: "Social share image", help: "1200 × 630 px recommended." }),
  ogImageAlt: f.text({ label: "Social image alt text", max: 160 }),
  noindex: f.boolean({ label: "Hide from search engines (noindex)" }),
  nofollow: f.boolean({ label: "Don't follow links (nofollow)" }),
  structuredData: f.textarea({
    label: "Custom JSON-LD schema",
    rows: 6,
    max: 20000,
    help: "Optional extra schema.org JSON. Must be valid JSON.",
  }),
};

export interface SeoData {
  title?: string;
  description?: string;
  focusKeyword?: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  nofollow?: boolean;
  structuredData?: string;
}

export const seoMongooseSchema = new Schema<SeoData>(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    focusKeyword: { type: String, trim: true },
    keywords: { type: [String], default: [] },
    canonical: { type: String, trim: true },
    ogTitle: { type: String, trim: true },
    ogDescription: { type: String, trim: true },
    ogImage: { type: String, trim: true },
    ogImageAlt: { type: String, trim: true },
    noindex: { type: Boolean, default: false },
    nofollow: { type: Boolean, default: false },
    structuredData: { type: String },
  },
  { _id: false }
);

/** Rejects structured data that isn't valid JSON, so the site never ships broken schema. */
export const jsonText = (max: number) =>
  z
    .string()
    .max(max)
    .refine(
      (v) => {
        if (!v.trim()) return true;
        try {
          JSON.parse(v);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Must be valid JSON" }
    );
