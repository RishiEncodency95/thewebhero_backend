import { Schema, model, Document } from "mongoose";

export interface ITeamMember extends Document {
  name: string;
  designation: string;
  photo?: string;
  bio?: string;
  socialLinks: { linkedin?: string; twitter?: string; github?: string };
  status: "draft" | "published";
  order: number;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true },
    photo: { type: String },
    bio: { type: String },
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      github: { type: String },
    },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const TeamMember = model<ITeamMember>("TeamMember", teamMemberSchema);
