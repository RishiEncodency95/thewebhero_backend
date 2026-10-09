import { Schema, model, Document, Types } from "mongoose";

export interface IMedia extends Document {
  fileName: string;
  originalName: string;
  url: string;
  publicId: string;
  resourceType: string;
  mimeType: string;
  size: number;
  folder?: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    folder: { type: String, default: "general" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Media = model<IMedia>("Media", mediaSchema);
