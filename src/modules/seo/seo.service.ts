import { ApiError } from "../../common/utils/ApiError";
import { contentRegistry, ContentTypeDefinition } from "../../cms/registry";
import { revalidateFrontend } from "../../cms/revalidate";
import { generateSeoSuggestion } from "./seo.provider";
import { seoProblems } from "./seo.score";
import { SeoContext } from "./seo.types";

type Doc = Record<string, unknown>;

// Fields that usually hold a content type's meaningful body text, in order of preference.
const BODY_FIELDS = ["shortDescription", "excerpt", "subtitle", "description", "overview", "intro", "problemStatement", "content", "bio", "story"];

function seoDefinition(resource: string): ContentTypeDefinition {
  const def = contentRegistry.get(resource);
  if (!def || def.kind !== "collection" || def.fields.seo?.type !== "seo") {
    throw ApiError.badRequest(`SEO generation is not supported for "${resource}"`);
  }
  return def;
}

function contextFor(def: ContentTypeDefinition, doc: Doc): SeoContext {
  const body = BODY_FIELDS.map((k) => doc[k])
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .join("\n\n");
  const slug = def.slugField && typeof doc[def.slugField] === "string" ? (doc[def.slugField] as string) : undefined;
  return {
    title: String(doc[def.titleField] ?? ""),
    body,
    slug,
    path: def.publicPath?.(doc) ?? (typeof doc.path === "string" ? doc.path : undefined),
    pageType: def.label,
    location: def.resource === "locations" ? `${String(doc.name)} (${doc.type === "city" ? "area near Ghaziabad / Delhi NCR, India" : "country"})` : undefined,
  };
}

/** Score inputs for a record, matching what the admin's SEO Center measures. */
export function scoreInputs(def: ContentTypeDefinition, doc: Doc) {
  const slug = def.slugField && typeof doc[def.slugField] === "string" ? (doc[def.slugField] as string) : undefined;
  return {
    seo: (doc.seo ?? {}) as { title?: string; description?: string; focusKeyword?: string; noindex?: boolean },
    title: String(doc[def.titleField] ?? ""),
    summary: def.summaryField ? String(doc[def.summaryField] ?? "") : "",
    slug,
  };
}

export const seoService = {
  /** Suggest SEO for a saved record of any content type that has an SEO block. */
  async generateForRecord(resource: string, id: string) {
    const def = seoDefinition(resource);
    const doc = await def.model.findById(id).lean<Doc>();
    if (!doc) throw ApiError.notFound("Content not found");
    return generateSeoSuggestion(contextFor(def, doc));
  },

  /** Suggest SEO from text the editor is still writing (works before the first save). */
  async suggest(input: { title: string; content?: string; slug?: string; path?: string; pageType?: string }) {
    if (!input.title.trim()) throw ApiError.badRequest("A title is needed to generate SEO");
    return generateSeoSuggestion({ title: input.title, body: input.content ?? "", slug: input.slug || undefined, path: input.path, pageType: input.pageType });
  },

  /**
   * Writes AI SEO into a record and saves it. Keeps the editor's share image,
   * canonical, robots and structured data. Returns the remaining problems.
   */
  async optimizeRecord(resource: string, id: string, { force = false } = {}) {
    const def = seoDefinition(resource);
    const doc = await def.model.findById(id);
    if (!doc) throw ApiError.notFound("Content not found");
    const data = doc.toObject() as Doc;

    const before = seoProblems(scoreInputs(def, data));
    if (!before.length && !force) return { changed: false, problems: before, seo: data.seo };

    const s = await generateSeoSuggestion(contextFor(def, data));
    const seo = {
      ...((data.seo as Doc) ?? {}),
      title: s.seoTitle,
      description: s.seoDescription,
      focusKeyword: s.focusKeyword,
      keywords: s.keywords,
      ogImageAlt: ((data.seo as Doc)?.ogImageAlt as string) || s.ogImageAlt,
    };
    doc.set("seo", seo);
    await doc.save();

    const slug = def.slugField ? data[def.slugField] : undefined;
    revalidateFrontend([def.resource, ...(slug ? [`${def.resource}:${slug}`] : [])]);
    return { changed: true, problems: seoProblems(scoreInputs(def, doc.toObject() as Doc)), seo };
  },
};
