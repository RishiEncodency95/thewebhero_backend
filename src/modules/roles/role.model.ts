import { Schema, model, Document } from "mongoose";

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[]; // ["resource:action", ...]
  isSystem: boolean; // system roles (super-admin) can't be deleted/renamed
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = model<IRole>("Role", roleSchema);
