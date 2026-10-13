import { z } from "zod";

// Fields every lead-capture model shares (contact enquiries, quote requests,
// support requests). Spread into each Mongoose schema definition.
export const LEAD_STATUSES = ["new", "in-progress", "resolved", "closed", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadBaseDefinition = {
  // Human-friendly id shown to the visitor and in the admin, e.g. "TWH-Q-260412-7KD2".
  referenceId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: [...LEAD_STATUSES], default: "new" as LeadStatus, index: true },
  // Internal admin notes - never exposed on public routes.
  notes: { type: String, default: "" },
  meta: {
    ip: { type: String },
    userAgent: { type: String },
    pageUrl: { type: String },
    referrer: { type: String },
  },
};

export interface LeadBaseFields {
  referenceId?: string;
  status: LeadStatus;
  notes: string;
  meta?: { ip?: string; userAgent?: string; pageUrl?: string; referrer?: string };
  createdAt: Date;
  updatedAt: Date;
}

// Optional text input: website forms send "" for untouched fields, so treat
// an empty string the same as "not provided".
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const stringList = (maxItems = 30, maxLen = 120) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).default([]);

// Fields every public lead form may send in addition to its own.
export const leadPublicFields = {
  pageUrl: optionalText(500),
  // Honeypot: real visitors never fill this hidden field.
  honeypot: z.string().optional(),
};
