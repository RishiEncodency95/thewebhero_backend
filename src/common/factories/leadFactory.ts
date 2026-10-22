import { Router, Request, Response, NextFunction } from "express";
import { Model, Document } from "mongoose";
import { AnyZodObject, z } from "zod";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildMeta } from "../utils/pagination";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { publicFormRateLimiter } from "../middlewares/rateLimiter.middleware";
import { auditLog } from "../middlewares/auditLogger.middleware";
import { DEFAULT_ROLES, Resource } from "../../config/constants";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { sendEmail } from "../utils/sendEmail";
import { escapeHtml } from "../utils/escapeHtml";
import { LEAD_STATUSES } from "./leadFields";
import { Role } from "../../modules/roles/role.model";
import { User } from "../../modules/users/user.model";
import { settings } from "../../content/site";
import { notificationService } from "../../modules/notifications/notification.service";

// Shared shape for lead-capture modules: public form submits, admin manages a
// status lifecycle (contact-enquiries, quote-requests, support-requests).
export const leadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});

export const leadUpdateSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    notes: z.string().max(5000).optional(),
  })
  .refine((v) => v.status !== undefined || v.notes !== undefined, { message: "Nothing to update" });

interface LeadOptions {
  resource: Resource;
  /** Prefix for the human-friendly reference id, e.g. "Q" -> TWH-Q-260412-7KD2. */
  refPrefix: string;
  /** Label used in admin notifications and emails, e.g. "quote request". */
  label: string;
  /** Fields searched by `?search=`. */
  searchableFields: string[];
  /** Name + email of the person who submitted, for notifications. */
  summarize: (doc: Record<string, unknown>) => { name: string; email: string; headline?: string };
}

function makeReferenceId(prefix: string) {
  const d = new Date();
  const date = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
  const rand = crypto.randomBytes(3).toString("base64url").replace(/[-_]/g, "X").toUpperCase().slice(0, 4);
  return `TWH-${prefix}-${date}-${rand}`;
}

// Fields that only the server sets - never accepted from the public form.
const SERVER_ONLY = ["status", "notes", "referenceId", "meta", "honeypot", "pageUrl"];

export function createLeadService<T extends Document>(model: Model<T>, options: LeadOptions) {
  // Admins who can read this lead type get an in-app notification.
  async function recipients() {
    const roles = await Role.find({
      $or: [{ name: DEFAULT_ROLES.SUPER_ADMIN }, { permissions: `${options.resource}:read` }],
    }).select("_id");
    return User.find({ role: { $in: roles.map((r) => r._id) }, isActive: true }).select("_id");
  }

  async function notify(doc: T) {
    const plain = doc.toObject() as Record<string, unknown>;
    const { name, email, headline } = options.summarize(plain);
    const ref = String(plain.referenceId ?? "");
    const link = `/dashboard/${options.resource}?id=${String(plain._id)}`;
    const title = `New ${options.label}`;
    const message = `${name} (${email})${headline ? ` — ${headline}` : ""}`;

    const users = await recipients();
    await Promise.all(users.map((u) => notificationService.notify(String(u._id), title, message, link)));

    const site = (await settings.get()) as {
      siteName?: string;
      notifications?: { leadsEmail?: string };
      contact?: { email?: string; phone?: string; whatsapp?: string };
    };
    const to = env.LEADS_NOTIFY_EMAIL || site.notifications?.leadsEmail || site.contact?.email;
    if (to) {
      const rows = Object.entries(plain)
        .filter(([k, v]) => !["_id", "__v", "updatedAt", "notes", "status"].includes(k) && v !== undefined && v !== "")
        .map(([k, v]) => {
          const value = Array.isArray(v) ? v.join(", ") : typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
          return `<tr><td style="padding:4px 12px 4px 0;color:#64748b;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0;color:#0f172a">${escapeHtml(value)}</td></tr>`;
        })
        .join("");
      await sendEmail({
        to,
        subject: `${title} ${ref} from ${name}`.slice(0, 200),
        html: `<h2 style="font-family:sans-serif">${escapeHtml(title)} ${escapeHtml(ref)}</h2><table style="font-family:sans-serif;font-size:14px">${rows}</table>`,
      });
    }

    // Confirmation to the visitor, so they know the request arrived and how to reach us.
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const brand = site.siteName || "TheWebHero";
      const c = site.contact ?? {};
      const reach = [
        c.phone && `Call: <a href="tel:${escapeHtml(c.phone.replace(/[^\d+]/g, ""))}">${escapeHtml(c.phone)}</a>`,
        c.whatsapp && `WhatsApp: <a href="https://wa.me/${escapeHtml(c.whatsapp.replace(/\D/g, ""))}">chat with us</a>`,
        c.email && `Email: <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>`,
      ].filter(Boolean);
      await sendEmail({
        to: email,
        subject: `We received your ${options.label}${ref ? ` (${ref})` : ""} - ${brand}`.slice(0, 200),
        html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#0f172a">
<p>Hi ${escapeHtml(name || "there")},</p>
<p>Thank you for contacting ${escapeHtml(brand)}. We have received your ${escapeHtml(options.label)} and our team will get back to you within 24 hours.</p>
${ref ? `<p>Your reference ID: <strong>${escapeHtml(ref)}</strong></p>` : ""}
${reach.length ? `<p>Need a quicker answer?<br>${reach.join("<br>")}</p>` : ""}
<p>Regards,<br>Team ${escapeHtml(brand)}</p>
</div>`,
      });
    }
  }

  return {
    async create(data: Record<string, unknown>, meta: Record<string, string | undefined>): Promise<T> {
      const clean = { ...data };
      for (const key of SERVER_ONLY) delete clean[key];
      const doc = await model.create({ ...clean, meta, referenceId: makeReferenceId(options.refPrefix) });

      // Notifications must never fail the visitor's submission.
      notify(doc).catch((err) => logger.error({ err }, `Lead notification failed for ${options.resource}`));
      return doc;
    },

    async getAll(req: Request) {
      const { page, limit, skip, sort } = getPagination(req);
      const filter: Record<string, unknown> = {};
      if (req.query.status) filter.status = req.query.status;

      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      if (search) {
        const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [...options.searchableFields, "referenceId"].map((f) => ({ [f]: { $regex: safe, $options: "i" } }));
      }

      const [items, total] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(limit),
        model.countDocuments(filter),
      ]);
      return { items, meta: buildMeta(total, page, limit) };
    },

    async stats() {
      const rows = await model.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
      const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<string, number>;
      for (const r of rows) byStatus[r._id] = r.count;
      const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
      return { total, byStatus };
    },

    async getById(id: string): Promise<T> {
      const doc = await model.findById(id);
      if (!doc) throw ApiError.notFound("Not found");
      return doc;
    },

    async update(id: string, data: { status?: string; notes?: string }): Promise<T> {
      const doc = await model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      if (!doc) throw ApiError.notFound("Not found");
      return doc;
    },

    async remove(id: string): Promise<void> {
      const doc = await model.findByIdAndDelete(id);
      if (!doc) throw ApiError.notFound("Not found");
    },
  };
}

export type LeadService<T extends Document> = ReturnType<typeof createLeadService<T>>;

export function createLeadController<T extends Document>(service: LeadService<T>) {
  return {
    create: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.create(req.body, {
        ip: req.ip,
        userAgent: req.get("user-agent")?.slice(0, 300),
        pageUrl: typeof req.body.pageUrl === "string" ? req.body.pageUrl : undefined,
        referrer: req.get("referer")?.slice(0, 500),
      });
      const referenceId = (doc as unknown as { referenceId: string }).referenceId;
      // Only the reference goes back to the public - never the stored record.
      res.status(201).json(new ApiResponse(201, { referenceId }, "Submitted successfully"));
    }),

    getAll: asyncHandler(async (req: Request, res: Response) => {
      const result = await service.getAll(req);
      res.status(200).json(new ApiResponse(200, result));
    }),

    stats: asyncHandler(async (_req: Request, res: Response) => {
      res.status(200).json(new ApiResponse(200, await service.stats()));
    }),

    getById: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.getById(req.params.id);
      res.status(200).json(new ApiResponse(200, doc));
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.update(req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, doc, "Updated successfully"));
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      await service.remove(req.params.id);
      res.status(200).json(new ApiResponse(200, null, "Deleted successfully"));
    }),
  };
}

// Bots that fill the hidden honeypot get a normal-looking success response,
// but nothing is stored or notified.
const honeypotGuard = (prefix: string) => (req: Request, res: Response, next: NextFunction) => {
  const trap = req.body?.honeypot;
  if (typeof trap === "string" && trap.trim() !== "") {
    logger.warn({ ip: req.ip }, "Lead honeypot triggered - submission dropped");
    res.status(201).json(new ApiResponse(201, { referenceId: makeReferenceId(prefix) }, "Submitted successfully"));
    return;
  }
  next();
};

interface LeadRouterOptions {
  resource: Resource;
  refPrefix: string;
  createSchema: AnyZodObject;
}

export function createLeadRouter<T extends Document>(
  controller: ReturnType<typeof createLeadController<T>>,
  { resource, refPrefix, createSchema }: LeadRouterOptions
) {
  const router = Router();

  // Public - anyone on the website can submit this form.
  router.post("/", publicFormRateLimiter, honeypotGuard(refPrefix), validateBody(createSchema), controller.create);

  // Admin-only management.
  router.get("/", authenticate, checkPermission(resource, "read"), controller.getAll);
  router.get("/stats", authenticate, checkPermission(resource, "read"), controller.stats);
  router.get("/:id", authenticate, checkPermission(resource, "read"), controller.getById);

  // Kept for backwards compatibility; PATCH /:id is the general update.
  router.put(
    "/:id/status",
    authenticate,
    checkPermission(resource, "update"),
    validateBody(leadStatusSchema),
    auditLog(resource, "update"),
    controller.update
  );

  router.patch(
    "/:id",
    authenticate,
    checkPermission(resource, "update"),
    validateBody(leadUpdateSchema),
    auditLog(resource, "update"),
    controller.update
  );

  router.delete(
    "/:id",
    authenticate,
    checkPermission(resource, "delete"),
    auditLog(resource, "delete"),
    controller.remove
  );

  return router;
}
