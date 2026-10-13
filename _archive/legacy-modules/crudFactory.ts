import { Router, Request, Response } from "express";
import { Model, Document } from "mongoose";
import { AnyZodObject } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildMeta } from "../utils/pagination";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { auditLog } from "../middlewares/auditLogger.middleware";
import { DEFAULT_ROLES, Resource } from "../../config/constants";

// Generic service: reusable CRUD data-access for simple content modules
// (blog, portfolio, faqs, testimonials, ...). Modules with custom business
// rules (auth, users, leads, media) should NOT use this - write their own service.
export function createCrudService<T extends Document>(model: Model<T>) {
  const hasStatus = Boolean(model.schema.path("status"));
  // Records without a status field are always public; others must be published.
  const isVisible = (doc: Document) => !hasStatus || doc.get("status") === "published";

  return {
    hasStatus,

    model,

    async create(data: Partial<T>): Promise<T> {
      return model.create(data);
    },

    async getAll(
      filter: Record<string, unknown>,
      limit: number,
      skip: number,
      sort: Record<string, 1 | -1>
    ) {
      const [items, total] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(limit),
        model.countDocuments(filter),
      ]);
      return { items, total };
    },

    async getById(id: string, publishedOnly = false): Promise<T> {
      const doc = await model.findById(id);
      if (!doc || (publishedOnly && !isVisible(doc))) throw ApiError.notFound("Resource not found");
      return doc;
    },

    async getBySlug(slug: string, publishedOnly = false): Promise<T> {
      const doc = await (model as unknown as Model<T & { slug: string }>).findOne({ slug });
      if (!doc || (publishedOnly && !isVisible(doc))) throw ApiError.notFound("Resource not found");
      return doc as unknown as T;
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const doc = await model.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      if (!doc) throw ApiError.notFound("Resource not found");
      return doc;
    },

    async remove(id: string): Promise<void> {
      const doc = await model.findByIdAndDelete(id);
      if (!doc) throw ApiError.notFound("Resource not found");
    },
  };
}

export type CrudService<T extends Document> = ReturnType<typeof createCrudService<T>>;

// Logged-in staff with read access see drafts; the public website only sees
// published records.
function canSeeDrafts(req: Request, resource?: Resource) {
  if (!req.user || !resource) return false;
  return req.user.role === DEFAULT_ROLES.SUPER_ADMIN || Boolean(req.user.permissions?.includes(`${resource}:read`));
}

export function createCrudController<T extends Document>(
  service: CrudService<T>,
  searchableFields: string[] = [],
  resource?: Resource
) {
  const publishedOnly = (req: Request) => service.hasStatus && !canSeeDrafts(req, resource);

  return {
    create: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.create(req.body);
      res.status(201).json(new ApiResponse(201, doc, "Created successfully"));
    }),

    getAll: asyncHandler(async (req: Request, res: Response) => {
      const { page, limit, skip, sort } = getPagination(req);
      const filter: Record<string, unknown> = {};

      if (req.query.status) filter.status = req.query.status;
      if (req.query.type) filter.type = req.query.type;
      if (publishedOnly(req)) filter.status = "published";

      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      if (search && searchableFields.length) {
        const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = searchableFields.map((field) => ({
          [field]: { $regex: safe, $options: "i" },
        }));
      }

      const { items, total } = await service.getAll(filter, limit, skip, sort);
      res.status(200).json(new ApiResponse(200, { items, meta: buildMeta(total, page, limit) }));
    }),

    getById: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.getById(req.params.id, publishedOnly(req));
      res.status(200).json(new ApiResponse(200, doc));
    }),

    getBySlug: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.getBySlug(req.params.slug, publishedOnly(req));
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

interface CrudRouterOptions {
  resource: Resource;
  createSchema: AnyZodObject;
  updateSchema: AnyZodObject;
  publicRead?: boolean; // true for content the public website needs (blog, services, etc.)
  hasSlug?: boolean;
}

export function createCrudRouter<T extends Document>(
  controller: ReturnType<typeof createCrudController<T>>,
  { resource, createSchema, updateSchema, publicRead = true, hasSlug = true }: CrudRouterOptions
) {
  const router = Router();

  if (publicRead) {
    // optionalAuth lets logged-in admins preview drafts on the same routes.
    router.get("/", optionalAuth, controller.getAll);
    if (hasSlug) router.get("/slug/:slug", optionalAuth, controller.getBySlug);
    router.get("/:id", optionalAuth, controller.getById);
  } else {
    router.get("/", authenticate, checkPermission(resource, "read"), controller.getAll);
    router.get("/:id", authenticate, checkPermission(resource, "read"), controller.getById);
  }

  router.post(
    "/",
    authenticate,
    checkPermission(resource, "create"),
    validateBody(createSchema),
    auditLog(resource, "create"),
    controller.create
  );

  router.put(
    "/:id",
    authenticate,
    checkPermission(resource, "update"),
    validateBody(updateSchema),
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
