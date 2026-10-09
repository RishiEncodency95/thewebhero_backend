import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  user: Types.ObjectId | null;
  userEmail?: string;
  action: "create" | "update" | "delete" | "login" | "logout";
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    userEmail: { type: String },
    action: {
      type: String,
      enum: ["create", "update", "delete", "login", "logout"],
      required: true,
    },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    changes: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
