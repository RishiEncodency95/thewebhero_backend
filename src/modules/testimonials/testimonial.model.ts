import { Schema, model, Document } from "mongoose";

export interface ITestimonial extends Document {
  clientName: string;
  clientDesignation?: string;
  clientCompany?: string;
  clientPhoto?: string;
  rating: number;
  message: string;
  status: "draft" | "published";
  order: number;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    clientName: { type: String, required: true, trim: true },
    clientDesignation: { type: String },
    clientCompany: { type: String },
    clientPhoto: { type: String },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    message: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Testimonial = model<ITestimonial>("Testimonial", testimonialSchema);
