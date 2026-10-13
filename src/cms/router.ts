import { Router, Request, Response } from "express";
import { asyncHandler } from "../common/utils/asyncHandler";
import { ApiResponse } from "../common/utils/ApiResponse";
import { ApiError } from "../common/utils/ApiError";
import { authenticate } from "../common/middlewares/auth.middleware";
import { DEFAULT_ROLES } from "../config/constants";
import { contentRegistry, ContentTypeDefinition } from "./registry";
import { describeFields } from "./describe";

const describe = (def: ContentTypeDefinition) => ({
  resource: def.resource,
  kind: def.kind,
  label: def.label,
  labelPlural: def.labelPlural,
  description: def.description,
  titleField: def.titleField,
  slugField: def.slugField,
  summaryField: def.summaryField,
  imageField: def.imageField,
  listColumns: def.listColumns,
  hasPublicPage: Boolean(def.publicPath),
  fields: describeFields(def.fields),
});

const canRead = (req: Request, resource: string) =>
  req.user?.role === DEFAULT_ROLES.SUPER_ADMIN || Boolean(req.user?.permissions?.includes(`${resource}:read`));

export const contentTypesRouter = Router();

// Form/table definitions the admin renders from - only types the user may read.
contentTypesRouter.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const types = contentRegistry.all().filter((d) => canRead(req, d.resource)).map(describe);
    res.status(200).json(new ApiResponse(200, types));
  })
);

contentTypesRouter.get(
  "/:resource",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const def = contentRegistry.get(req.params.resource);
    if (!def || !canRead(req, def.resource)) throw ApiError.notFound("Unknown content type");
    res.status(200).json(new ApiResponse(200, describe(def)));
  })
);

export const sitemapRouter = Router();

// Every indexable public URL with its last-modified date, for the website's sitemap.xml.
sitemapRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const entries: { path: string; lastModified: string; priority: number; changefreq: string }[] = [];

    for (const def of contentRegistry.all()) {
      if (def.kind !== "collection" || !def.publicPath || !def.sitemap) continue;
      const docs = await def.model
        .find({ status: "published", "seo.noindex": { $ne: true } })
        .select(`${def.slugField ?? ""} type updatedAt`)
        .lean<Record<string, unknown>[]>();
      for (const doc of docs) {
        const path = def.publicPath(doc);
        if (!path) continue;
        entries.push({
          path,
          lastModified: new Date(doc.updatedAt as Date).toISOString(),
          priority: def.sitemap.priority,
          changefreq: def.sitemap.changefreq,
        });
      }
    }

    // Fixed pages, as configured in Page SEO.
    const seoPages = contentRegistry.get("seo-pages");
    if (seoPages) {
      const pages = await seoPages.model
        .find({ status: "published", "seo.noindex": { $ne: true }, "sitemap.exclude": { $ne: true } })
        .select("path sitemap updatedAt")
        .lean<{ path: string; sitemap?: { priority?: number; changefreq?: string }; updatedAt: Date }[]>();
      for (const p of pages) {
        entries.push({
          path: p.path,
          lastModified: new Date(p.updatedAt).toISOString(),
          priority: p.sitemap?.priority ?? (p.path === "/" ? 1 : 0.7),
          changefreq: p.sitemap?.changefreq || "weekly",
        });
      }
    }

    res.status(200).json(new ApiResponse(200, entries));
  })
);
