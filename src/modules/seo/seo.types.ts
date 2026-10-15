export interface SeoSuggestion {
  focusKeyword: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  ogImageAlt: string;
}

/** What the AI is told about the page it writes SEO for. */
export interface SeoContext {
  title: string;
  body: string;
  slug?: string;
  path?: string;
  pageType?: string;
  location?: string;
}
