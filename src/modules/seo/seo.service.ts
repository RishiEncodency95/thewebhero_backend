import { ApiError } from "../../common/utils/ApiError";
import { contentRegistry } from "../../cms/registry";
import { generateSeoSuggestion } from "./seo.provider";
import { SeoSuggestion } from "./seo.types";

// Fields that usually hold a content type's meaningful body text, in order of preference.
const BODY_FIELDS = ["shortDescription", "excerpt", "description", "overview", "content", "bio", "story"];

export const seoService = {
  /** Suggest SEO for a saved record of any content type that has an SEO block. */
  async generateForRecord(resource: string, id: string): Promise<SeoSuggestion> {
    const def = contentRegistry.get(resource);
    if (!def || def.kind !== "collection" || def.fields.seo?.type !== "seo") {
      throw ApiError.badRequest(`SEO generation is not supported for "${resource}"`);
    }
    const doc = await def.model.findById(id).lean<Record<string, unknown>>();
    if (!doc) throw ApiError.notFound("Content not found");

    const title = String(doc[def.titleField] ?? "");
    const body = BODY_FIELDS.map((k) => doc[k])
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      .join("\n\n");
    return this.suggest(title, body);
  },

  /** Suggest SEO from text the editor is still writing (works before the first save). */
  async suggest(title: string, body: string): Promise<SeoSuggestion> {
    if (!title.trim()) throw ApiError.badRequest("A title is needed to generate SEO");
    return generateSeoSuggestion(title, body);
  },
};
