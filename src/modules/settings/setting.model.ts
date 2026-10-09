import { Schema, model, Document } from "mongoose";

export interface ISetting extends Document {
  siteName: string;
  logo?: string;
  favicon?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  defaultSeo: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  maintenanceMode: boolean;
}

const settingSchema = new Schema<ISetting>(
  {
    siteName: { type: String, required: true, default: "TheWebHero" },
    logo: { type: String },
    favicon: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    address: { type: String },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      linkedin: { type: String },
      instagram: { type: String },
      youtube: { type: String },
    },
    defaultSeo: {
      title: { type: String },
      description: { type: String },
      ogImage: { type: String },
    },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Setting = model<ISetting>("Setting", settingSchema);
