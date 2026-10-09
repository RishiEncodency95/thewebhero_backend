import { Request } from "express";
import { AuditLog } from "./auditLog.model";
import { getPagination, buildMeta } from "../../common/utils/pagination";
import { logger } from "../../config/logger";

interface RecordParams {
  req: Request;
  action: "create" | "update" | "delete" | "login" | "logout";
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  userId?: string;
  userEmail?: string;
}

export const auditLogService = {
  async record({
    req,
    action,
    resource,
    resourceId,
    changes,
    userId,
    userEmail,
  }: RecordParams): Promise<void> {
    try {
      await AuditLog.create({
        user: userId ?? req.user?.sub ?? null,
        userEmail: userEmail ?? req.user?.email,
        action,
        resource,
        resourceId,
        changes,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
    } catch (error) {
      // Audit logging must never break the main request flow.
      logger.error(error, "Failed to write audit log");
    }
  },

  async list(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const filter: Record<string, unknown> = {};
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.userId) filter.user = req.query.userId;

    const [items, total] = await Promise.all([
      AuditLog.find(filter).populate("user", "name email").sort(sort).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },
};
