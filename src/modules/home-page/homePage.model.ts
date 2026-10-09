import { Schema, model, Document } from "mongoose";

export interface IHomePage extends Document {
  hero: {
    title: string;
    subtitle?: string;
    image?: string;
    ctaText?: string;
    ctaLink?: string;
  };
  stats: { label: string; value: string }[];
  sections: { type: string; title: string; content?: string; items?: unknown[] }[];
  seo: { title?: string; description?: string; ogImage?: string };
}

const homePageSchema = new Schema<IHomePage>(
  {
    hero: {
      title: { type: String, default: "" },
      subtitle: { type: String },
      image: { type: String },
      ctaText: { type: String },
      ctaLink: { type: String },
    },
    stats: [{ label: { type: String }, value: { type: String } }],
    sections: [
      {
        type: { type: String, required: true },
        title: { type: String, required: true },
        content: { type: String },
        items: [{ type: Schema.Types.Mixed }],
      },
    ],
    seo: {
      title: { type: String },
      description: { type: String },
      ogImage: { type: String },
    },
  },
  { timestamps: true }
);

export const HomePage = model<IHomePage>("HomePage", homePageSchema);
