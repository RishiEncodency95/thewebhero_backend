import { Schema, model, Document } from "mongoose";

export interface IFaq extends Document {
  question: string;
  answer: string;
  category?: string;
  status: "draft" | "published";
  order: number;
}

const faqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Faq = model<IFaq>("Faq", faqSchema);
