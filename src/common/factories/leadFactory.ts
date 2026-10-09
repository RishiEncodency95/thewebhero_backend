import { Router, Request, Response } from "express";
import { Model, Document } from "mongoose";
import { AnyZodObject, z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildMeta } from "../utils/pagination";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { publicFormRateLimiter } from "../middlewares/rateLimiter.middleware";
import { auditLog } from "../middlewares/auditLogger.middleware";
import { Resource } from "../../config/constants";

// Shared shape for lead-capture modules: public form submits, admin manages a
// status lifecycle (contact-enquiries, quote-requests, support-requests).
export const leadStatusSchema = z.object({
  status: z.enum(["new", "in-progress", "resolved", "closed", "spam"]),
});

export function createLeadService<T extends Document>(model: Model<T>) {
  return {
    async create(data: Partial<T>): Promise<T> {
      return model.create(data);
    },

    async getAll(req: Request) {
      const { page, limit, skip, sort } = getPagination(req);
      const filter: Record<string, unknown> = {};
      if (req.query.status) filter.status = req.query.status;

      const [items, total] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(limit),
        model.countDocuments(filter),
      ]);
      return { items, meta: buildMeta(total, page, limit) };
    },

    async getById(id: string): Promise<T> {
      const doc = await model.findById(id);
      if (!doc) throw ApiError.notFound("Not found");
      return doc;
    },

    async updateStatus(id: string, status: string): Promise<T> {
      const doc = await model.findByIdAndUpdate(id, { status }, { new: true });
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
      const doc = await service.create(req.body);
      res.status(201).json(new ApiResponse(201, doc, "Submitted successfully"));
    }),

    getAll: asyncHandler(async (req: Request, res: Response) => {
      const result = await service.getAll(req);
      res.status(200).json(new ApiResponse(200, result));
    }),

    getById: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.getById(req.params.id);
      res.status(200).json(new ApiResponse(200, doc));
    }),

    updateStatus: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.updateStatus(req.params.id, req.body.status);
      res.status(200).json(new ApiResponse(200, doc, "Status updated"));
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      await service.remove(req.params.id);
      res.status(200).json(new ApiResponse(200, null, "Deleted successfully"));
    }),
  };
}

interface LeadRouterOptions {
  resource: Resource;
  createSchema: AnyZodObject;
}

export function createLeadRouter<T extends Document>(
  controller: ReturnType<typeof createLeadController<T>>,
  { resource, createSchema }: LeadRouterOptions
) {
  const router = Router();

  // Public - anyone on the website can submit this form.
  router.post("/", publicFormRateLimiter, validateBody(createSchema), controller.create);

  // Admin-only management.
  router.get("/", authenticate, checkPermission(resource, "read"), controller.getAll);
  router.get("/:id", authenticate, checkPermission(resource, "read"), controller.getById);

  router.put(
    "/:id/status",
    authenticate,
    checkPermission(resource, "update"),
    validateBody(leadStatusSchema),
    auditLog(resource, "update"),
    controller.updateStatus
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
