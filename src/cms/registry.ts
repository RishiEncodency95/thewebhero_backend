import { Model } from "mongoose";
import { FieldMap } from "./fields";

// Every content type registers itself here so cross-cutting features
// (ref population, sitemap, admin schema endpoint, AI SEO) can find it.
export interface ContentTypeDefinition {
  resource: string;
  kind: "collection" | "singleton";
  label: string;
  labelPlural: string;
  description?: string;
  fields: FieldMap;
  model: Model<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  titleField: string;
  slugField: string | null;
  summaryField?: string;
  imageField?: string;
  listColumns: string[];
  hasStatus: boolean;
  /** Website path for an item, used for the sitemap, revalidation and "view on site". */
  publicPath?: (doc: Record<string, unknown>) => string | null;
  sitemap?: { priority: number; changefreq: SitemapChangefreq };
}

export type SitemapChangefreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

const registry = new Map<string, ContentTypeDefinition>();

export const contentRegistry = {
  register(def: ContentTypeDefinition) {
    if (registry.has(def.resource)) throw new Error(`Content type "${def.resource}" registered twice`);
    registry.set(def.resource, def);
  },
  get(resource: string) {
    return registry.get(resource);
  },
  all() {
    return [...registry.values()];
  },
};
