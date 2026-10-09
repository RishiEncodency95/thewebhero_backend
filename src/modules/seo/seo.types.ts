export interface SeoSuggestion {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  ogImageAlt: string;
}

// Content modules that have a `seo` sub-document and can be targeted by
// POST /api/v1/seo/generate/:resource/:id
export const SEO_SUPPORTED_RESOURCES = [
  "blog",
  "portfolio",
  "case-studies",
  "services",
  "solutions",
  "pages",
  "resources",
  "locations",
] as const;

export type SeoSupportedResource = (typeof SEO_SUPPORTED_RESOURCES)[number];
