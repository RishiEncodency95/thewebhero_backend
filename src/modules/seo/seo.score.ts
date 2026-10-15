// SEO checks shared by the AI optimizer. Mirrors analyseSeo() in the admin
// (twh_admin/src/lib/cms.ts) so a page scores the same in both places.

export interface SeoInput {
  seo?: { title?: string; description?: string; focusKeyword?: string; noindex?: boolean };
  title?: string;
  summary?: string;
  slug?: string;
}

export const TITLE_RANGE = [30, 60] as const;
export const DESCRIPTION_RANGE = [110, 160] as const;

export const keywordSlug = (kw: string) => kw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Problems that keep a page below 100; empty means a perfect score. */
export function seoProblems({ seo = {}, title: fallbackTitle = "", summary = "", slug }: SeoInput): string[] {
  const title = (seo.title || fallbackTitle).trim();
  const description = (seo.description || summary).trim();
  const kw = (seo.focusKeyword ?? "").trim().toLowerCase();
  const problems: string[] = [];

  if (seo.noindex) problems.push("page is noindex");
  if (!seo.title) problems.push("no custom meta title");
  if (title.length < TITLE_RANGE[0] || title.length > TITLE_RANGE[1]) problems.push(`title is ${title.length} chars (need ${TITLE_RANGE[0]}–${TITLE_RANGE[1]})`);
  if (description.length < DESCRIPTION_RANGE[0] || description.length > DESCRIPTION_RANGE[1]) {
    problems.push(`description is ${description.length} chars (need ${DESCRIPTION_RANGE[0]}–${DESCRIPTION_RANGE[1]})`);
  }
  if (!kw) {
    problems.push("no focus keyword");
  } else {
    if (!title.toLowerCase().includes(kw)) problems.push(`focus keyword "${kw}" is not in the title`);
    if (!description.toLowerCase().includes(kw)) problems.push(`focus keyword "${kw}" is not in the description`);
    if (slug !== undefined && !slug.includes(keywordSlug(kw))) problems.push(`focus keyword "${kw}" does not match the URL slug "${slug}"`);
  }
  return problems;
}
