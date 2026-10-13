import { Router, Request, Response } from "express";
import { Model, Schema, model as createModel } from "mongoose";
import slugify from "slugify";
import { z } from "zod";
import { asyncHandler } from "../common/utils/asyncHandler";
import { ApiResponse } from "../common/utils/ApiResponse";
import { ApiError } from "../common/utils/ApiError";
import { buildMeta } from "../common/utils/pagination";
import { authenticate, optionalAuth } from "../common/middlewares/auth.middleware";
import { checkPermission } from "../common/middlewares/rbac.middleware";
import { validateBody } from "../common/middlewares/validate.middleware";
import { auditLog } from "../common/middlewares/auditLogger.middleware";
import { DEFAULT_ROLES, Resource } from "../config/constants";
import { FieldMap, f } from "./fields";
import { buildDefinition } from "./mongoose";
import { buildValidator } from "./validation";
import { contentRegistry, ContentTypeDefinition, SitemapChangefreq } from "./registry";
import { revalidateFrontend } from "./revalidate";

type Doc = Record<string, unknown>;

export interface ContentModuleConfig {
  resource: Resource;
  modelName: string;
  label: string;
  labelPlural: string;
  description?: string;
  fields: FieldMap;
  titleField?: string;
  /** null for content without its own page (FAQs, testimonials...). */
  slugField?: string | null;
  summaryField?: string;
  imageField?: string;
  /** Columns shown in the admin table. */
  listColumns?: string[];
  searchable?: string[];
  /** Query params accepted as exact-match filters, e.g. ["categorySlug"]. */
  filterable?: string[];
  /** Fields returned by `?view=summary` (listing pages, menus). */
  summaryFields?: string[];
  defaultSort?: Record<string, 1 | -1>;
  publicPath?: (doc: Doc) => string | null;
  sitemap?: { priority: number; changefreq: SitemapChangefreq };
  /** Extra tags to revalidate on change, e.g. pages that list this content. */
  extraRevalidateTags?: string[];
  /** Status for new records; "published" for settings-like content. */
  defaultStatus?: "draft" | "published";
  /** Extra unique indexes, e.g. [{ path: 1 }]. */
  uniqueIndexes?: Record<string, 1>[];
  /** Runs before validation on every save, e.g. to normalise a field. */
  beforeValidate?: (doc: Doc) => void;
  /** Registers additional routes before the generic ones (so they win over "/:id"). */
  extraRoutes?: (router: Router, ctx: { Model: Model<Doc>; tagsFor: (doc: Doc | null) => string[] }) => void;
}

// Every collection gets the same publishing controls.
const systemFields: FieldMap = {
  status: f.select({
    label: "Status",
    group: "Publish",
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
    ],
  }),
  featured: f.boolean({ label: "Featured", group: "Publish" }),
  sortOrder: f.number({ label: "Sort order", group: "Publish", integer: true, help: "Lower numbers appear first." }),
};

const MAX_ADMIN_LIMIT = 200;
const MAX_PUBLIC_LIMIT = 500;

function canManage(req: Request, resource: string) {
  if (!req.user) return false;
  return req.user.role === DEFAULT_ROLES.SUPER_ADMIN || Boolean(req.user.permissions?.includes(`${resource}:read`));
}

export function defineContentModule(config: ContentModuleConfig) {
  const {
    resource,
    modelName,
    titleField = "title",
    slugField = "slug",
    summaryField,
    searchable = [titleField],
    filterable = [],
    defaultSort = { sortOrder: 1, createdAt: -1 },
  } = config;

  const allFields: FieldMap = { ...config.fields, ...systemFields };

  // ── Model ──────────────────────────────────────────────────────────────
  const schema = new Schema(
    {
      ...buildDefinition(config.fields),
      status: { type: String, enum: ["draft", "published"], default: config.defaultStatus ?? "draft", index: true },
      featured: { type: Boolean, default: false },
      sortOrder: { type: Number, default: 0 },
    },
    {
      timestamps: true,
      versionKey: false,
      toJSON: {
        transform: (_doc, ret: Doc) => {
          ret.id = String(ret._id);
          return ret;
        },
      },
    }
  );

  if (slugField) {
    schema.index({ [slugField]: 1 }, { unique: true, sparse: true });
    const fromField = (config.fields[slugField] as { from?: string } | undefined)?.from ?? titleField;

    // Generate a unique slug from the title when none is given.
    schema.pre("validate", async function () {
      const doc = this as unknown as Doc & { _id: unknown; constructor: Model<Doc> };
      let slug = String(doc[slugField] ?? "").trim();
      if (!slug) slug = slugify(String(doc[fromField] ?? ""), { lower: true, strict: true }).slice(0, 150);
      if (!slug) return;
      let candidate = slug;
      for (let i = 2; await doc.constructor.exists({ [slugField]: candidate, _id: { $ne: doc._id } }); i++) {
        candidate = `${slug}-${i}`;
      }
      doc[slugField] = candidate;
    });
  }
  if (config.beforeValidate) {
    const hook = config.beforeValidate;
    schema.pre("validate", function () {
      hook(this as unknown as Doc);
    });
  }
  schema.index({ status: 1, sortOrder: 1 });
  for (const idx of config.uniqueIndexes ?? []) schema.index(idx, { unique: true });

  const Model = createModel<Doc>(modelName, schema);

  // ── Validation ─────────────────────────────────────────────────────────
  const createSchema = buildValidator(allFields);
  const updateSchema = createSchema.partial();

  // ── Helpers ────────────────────────────────────────────────────────────
  const tagsFor = (doc: Doc | null) => {
    const tags = [resource, "sitemap", ...(config.extraRevalidateTags ?? [])];
    if (doc && slugField && doc[slugField]) tags.push(`${resource}:${doc[slugField]}`);
    return tags;
  };

  /** Replaces slug arrays in `refs` fields with { slug, title, name, shortDescription, category }. */
  async function populateRefs(doc: Doc): Promise<Doc> {
    const out = { ...doc };
    await Promise.all(
      Object.entries(config.fields).map(async ([key, field]) => {
        if (field.type !== "refs") return;
        const slugs = (doc[key] as string[] | undefined) ?? [];
        const target = contentRegistry.get(field.resource);
        if (!slugs.length || !target?.slugField) {
          out[key] = [];
          return;
        }
        const filter: Doc = { [target.slugField]: { $in: slugs } };
        if (target.hasStatus) filter.status = "published";
        const projection = [target.slugField, target.titleField, target.summaryField, "category", "iconName"].filter(Boolean).join(" ");
        const found = await target.model.find(filter).select(projection).lean<Doc[]>();
        const bySlug = new Map(found.map((d) => [String(d[target.slugField!]), d]));
        out[key] = slugs
          .map((s) => bySlug.get(s))
          .filter(Boolean)
          .map((d) => ({
            slug: d![target.slugField!],
            title: d![target.titleField],
            name: d![target.titleField],
            shortDescription: target.summaryField ? d![target.summaryField] ?? "" : "",
            category: d!.category,
            iconName: d!.iconName,
          }));
      })
    );
    return out;
  }

  const sortable = new Set([...Object.keys(allFields), "createdAt", "updatedAt"]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const list = asyncHandler(async (req: Request, res: Response) => {
    const admin = canManage(req, resource);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(admin ? MAX_ADMIN_LIMIT : MAX_PUBLIC_LIMIT, Math.max(1, Number(req.query.limit) || 20));

    const filter: Doc = {};
    if (!admin) filter.status = "published";
    else if (req.query.status === "draft" || req.query.status === "published") filter.status = req.query.status;
    if (req.query.featured === "true") filter.featured = true;
    for (const key of filterable) {
      const v = req.query[key];
      if (typeof v === "string" && v) filter[key] = v;
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = searchable.map((field) => ({ [field]: { $regex: safe, $options: "i" } }));
    }

    const sortBy = typeof req.query.sortBy === "string" && sortable.has(req.query.sortBy) ? req.query.sortBy : null;
    const sort = sortBy ? { [sortBy]: req.query.sortOrder === "desc" ? -1 : 1 } : defaultSort;

    let query = Model.find(filter).sort(sort as Record<string, 1 | -1>).skip((page - 1) * limit).limit(limit);
    if (req.query.view === "summary" && config.summaryFields) {
      query = query.select([...config.summaryFields, "status", "featured", "sortOrder", "updatedAt"].join(" "));
    }

    const [rawItems, total] = await Promise.all([query.lean<Doc[]>(), Model.countDocuments(filter)]);
    for (const item of rawItems) item.id = String(item._id);
    // ?populate=true resolves refs on lists too (small collections like business needs).
    const items = req.query.populate === "true" && !admin ? await Promise.all(rawItems.map(populateRefs)) : rawItems;
    res.status(200).json(new ApiResponse(200, { items, meta: buildMeta(total, page, limit) }));
  });

  const getBySlug = asyncHandler(async (req: Request, res: Response) => {
    if (!slugField) throw ApiError.notFound();
    const filter: Doc = { [slugField]: req.params.slug };
    if (!canManage(req, resource)) filter.status = "published";
    const doc = await Model.findOne(filter).lean<Doc>();
    if (!doc) throw ApiError.notFound(`${config.label} not found`);
    doc.id = String(doc._id);
    res.status(200).json(new ApiResponse(200, req.query.populate === "false" ? doc : await populateRefs(doc)));
  });

  const getById = asyncHandler(async (req: Request, res: Response) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${config.label} not found`);
    res.status(200).json(new ApiResponse(200, doc));
  });

  const create = asyncHandler(async (req: Request, res: Response) => {
    const doc = await Model.create(req.body);
    revalidateFrontend(tagsFor(doc.toObject()));
    res.status(201).json(new ApiResponse(201, doc, `${config.label} created`));
  });

  const update = asyncHandler(async (req: Request, res: Response) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${config.label} not found`);
    const before = doc.toObject();
    doc.set(req.body);
    await doc.save();
    revalidateFrontend([...tagsFor(before), ...tagsFor(doc.toObject())]);
    res.status(200).json(new ApiResponse(200, doc, `${config.label} updated`));
  });

  const remove = asyncHandler(async (req: Request, res: Response) => {
    const doc = await Model.findByIdAndDelete(req.params.id).lean<Doc>();
    if (!doc) throw ApiError.notFound(`${config.label} not found`);
    revalidateFrontend(tagsFor(doc));
    res.status(200).json(new ApiResponse(200, null, `${config.label} deleted`));
  });

  const reorderSchema = z.object({
    items: z.array(z.object({ id: z.string().regex(/^[a-f0-9]{24}$/), sortOrder: z.number().int() })).min(1).max(500),
  });
  const reorder = asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body as z.infer<typeof reorderSchema>;
    await Model.bulkWrite(items.map((i) => ({ updateOne: { filter: { _id: i.id }, update: { sortOrder: i.sortOrder } } })));
    revalidateFrontend(tagsFor(null));
    res.status(200).json(new ApiResponse(200, null, "Order saved"));
  });

  // ── Router ─────────────────────────────────────────────────────────────
  const router = Router();
  config.extraRoutes?.(router, { Model, tagsFor });
  // Public reads; logged-in staff additionally see drafts (preview).
  router.get("/", optionalAuth, list);
  if (slugField) router.get("/slug/:slug", optionalAuth, getBySlug);
  router.get("/:id", authenticate, checkPermission(resource, "read"), getById);
  router.post("/", authenticate, checkPermission(resource, "create"), validateBody(createSchema), auditLog(resource, "create"), create);
  router.put("/reorder", authenticate, checkPermission(resource, "update"), validateBody(reorderSchema), auditLog(resource, "update"), reorder);
  router.put("/:id", authenticate, checkPermission(resource, "update"), validateBody(updateSchema), auditLog(resource, "update"), update);
  router.delete("/:id", authenticate, checkPermission(resource, "delete"), auditLog(resource, "delete"), remove);

  const definition: ContentTypeDefinition = {
    resource,
    kind: "collection",
    label: config.label,
    labelPlural: config.labelPlural,
    description: config.description,
    fields: allFields,
    model: Model,
    titleField,
    slugField,
    summaryField,
    imageField: config.imageField,
    listColumns: config.listColumns ?? [titleField],
    hasStatus: true,
    publicPath: config.publicPath,
    sitemap: config.sitemap,
  };
  contentRegistry.register(definition);

  return { Model, router, definition, createSchema, updateSchema };
}
