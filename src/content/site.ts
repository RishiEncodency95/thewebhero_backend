// Site-wide content: per-path SEO, global settings, company info, home page.
import { Request, Response } from "express";
import { defineContentModule } from "../cms/contentModule";
import { defineSingleton } from "../cms/singleton";
import { f } from "../cms/fields";
import { asyncHandler } from "../common/utils/asyncHandler";
import { ApiResponse } from "../common/utils/ApiResponse";
import { ApiError } from "../common/utils/ApiError";

/** "/Company/About/" -> "/company/about" */
export const normalizePath = (p: string) => {
  const clean = `/${p.trim().replace(/^\/+|\/+$/g, "").toLowerCase()}`;
  return clean === "/" ? "/" : clean.replace(/\/+/g, "/");
};

// On-page SEO for every fixed page of the website (home, hubs, company pages,
// contact...). Detail pages (a service, a blog post) carry SEO on their own record.
export const seoPages = defineContentModule({
  resource: "seo-pages",
  modelName: "SeoPage",
  label: "Page SEO",
  labelPlural: "Page SEO",
  description: "Meta tags, social sharing and indexing for each fixed page of the website.",
  titleField: "label",
  slugField: null,
  listColumns: ["label", "path", "status"],
  searchable: ["label", "path"],
  defaultSort: { sortOrder: 1, path: 1 },
  defaultStatus: "published",
  uniqueIndexes: [{ path: 1 }],
  // Normalise paths on every save so lookups always match.
  beforeValidate: (doc) => {
    if (typeof doc.path === "string") doc.path = normalizePath(doc.path);
  },
  fields: {
    label: f.text({ label: "Page name", required: true, max: 120 }),
    path: f.text({ label: "URL path", required: true, max: 200, help: 'e.g. "/", "/services", "/company/about"' }),
    sitemap: f.object({
      label: "Sitemap",
      of: {
        exclude: f.boolean("Exclude from sitemap"),
        priority: f.number({ label: "Priority (0–1)", min: 0, max: 1 }),
        changefreq: f.select({ label: "Change frequency", options: ["daily", "weekly", "monthly", "yearly"] }),
      },
    }),
    seo: f.seo(),
  },
  extraRoutes: (router, { Model }) => {
    // GET /seo-pages/by-path?path=/company/about  (public)
    router.get(
      "/by-path",
      asyncHandler(async (req: Request, res: Response) => {
        if (typeof req.query.path !== "string") throw ApiError.badRequest("path is required");
        const doc = await Model.findOne({ path: normalizePath(req.query.path), status: "published" }).lean();
        if (!doc) throw ApiError.notFound("No SEO configured for this path");
        res.status(200).json(new ApiResponse(200, doc));
      })
    );
  },
});

const contactFields = {
  email: f.email("Email"),
  salesEmail: f.email("Sales email"),
  privacyEmail: f.email("Privacy email"),
  legalEmail: f.email("Legal email"),
  phone: f.text({ label: "Phone (display)", max: 40 }),
  whatsapp: f.text({ label: "WhatsApp number", max: 20, help: "Digits with country code, e.g. 919876543210" }),
  hours: f.text({ label: "Business hours", max: 80 }),
  address: f.object({
    label: "Address",
    of: {
      street: f.text("Street"),
      locality: f.text("City / locality"),
      region: f.text("State / region"),
      postalCode: f.text("Postal code"),
      country: f.text({ label: "Country code", max: 2, help: "e.g. IN" }),
    },
  }),
};

export const settings = defineSingleton({
  resource: "settings",
  modelName: "SiteSettings",
  label: "Site settings",
  description: "Brand, global SEO defaults, analytics, contact details and social profiles.",
  privateFields: ["notifications"],
  fields: {
    siteName: f.text({ label: "Site name", max: 80, group: "Brand" }),
    tagline: f.text({ label: "Tagline", max: 120, group: "Brand" }),
    logo: f.image({ label: "Logo", group: "Brand" }),
    titleTemplate: f.text({ label: "Title template", max: 80, group: "SEO defaults", help: 'Use %s for the page title, e.g. "%s | TheWebHero"' }),
    defaultTitle: f.text({ label: "Default title", max: 120, group: "SEO defaults" }),
    defaultDescription: f.textarea({ label: "Default description", max: 320, rows: 3, group: "SEO defaults" }),
    defaultOgImage: f.image({ label: "Home page social image", group: "SEO defaults", help: "1200 × 630 px. Other pages without their own image get a branded image generated from their title." }),
    twitterHandle: f.text({ label: "X / Twitter handle", max: 40, group: "SEO defaults", help: "e.g. @thewebhero" }),
    verification: f.object({
      label: "Search console verification",
      group: "SEO defaults",
      of: { google: f.text("Google verification code"), bing: f.text("Bing verification code") },
    }),
    analytics: f.object({
      label: "Analytics",
      group: "Analytics",
      of: { gaMeasurementId: f.text({ label: "GA4 measurement ID", help: "e.g. G-XXXXXXX" }), gtmId: f.text({ label: "Google Tag Manager ID", help: "e.g. GTM-XXXXXX" }) },
    }),
    contact: f.object({ label: "Contact details", group: "Contact", of: contactFields }),
    social: f.object({
      label: "Social profiles",
      group: "Contact",
      of: { linkedin: f.url("LinkedIn"), twitter: f.url("X / Twitter"), facebook: f.url("Facebook"), instagram: f.url("Instagram"), youtube: f.url("YouTube") },
    }),
    organization: f.object({
      label: "Organization (schema.org)",
      group: "Brand",
      of: { legalName: f.text("Legal name"), founded: f.text({ label: "Founded (year)", max: 4 }), description: f.textarea("Description") },
    }),
    notifications: f.object({
      label: "Notifications",
      group: "Notifications",
      of: { leadsEmail: f.email({ label: "New lead alerts go to", help: "Requires SMTP to be configured on the server." }) },
    }),
  },
});

export const company = defineSingleton({
  resource: "company",
  modelName: "CompanyInfo",
  label: "Company info",
  description: "Story, mission, values, delivery process and culture shown on the Company pages.",
  fields: {
    name: f.text({ label: "Company name", max: 120, group: "About" }),
    tagline: f.text({ label: "Tagline", max: 200, group: "About" }),
    story: f.textarea({ label: "Our story", max: 4000, rows: 5, group: "About" }),
    mission: f.textarea({ label: "Mission", max: 1000, group: "About" }),
    vision: f.textarea({ label: "Vision", max: 1000, group: "About" }),
    capabilities: f.stringList({ label: "What we build", group: "About" }),
    values: f.list({
      label: "Values",
      group: "Values & culture",
      itemLabel: "title",
      of: { title: f.text({ label: "Title", required: true }), description: f.textarea("Description"), iconName: f.icon("Icon") },
    }),
    culture: f.list({
      label: "Culture principles",
      group: "Values & culture",
      itemLabel: "title",
      of: { title: f.text({ label: "Title", required: true }), description: f.textarea("Description"), iconName: f.icon("Icon") },
    }),
    process: f.list({
      label: "Delivery process",
      group: "Process",
      itemLabel: "title",
      of: {
        step: f.number({ label: "Step #", integer: true, min: 1 }),
        title: f.text({ label: "Title", required: true }),
        description: f.textarea("Description"),
        keyActivities: f.stringList("Key activities"),
        deliverables: f.stringList("Deliverables"),
      },
    }),
  },
});

export const homePage = defineSingleton({
  resource: "home-page",
  modelName: "HomePage",
  label: "Home page",
  description: "Hero and headline numbers on the home page. Other sections come from Services, Portfolio, Testimonials, FAQs and Blog.",
  fields: {
    hero: f.object({
      label: "Hero",
      group: "Hero",
      of: {
        eyebrow: f.text({ label: "Eyebrow", max: 60 }),
        titleLine1: f.text({ label: "Title line 1", max: 80 }),
        titleLine2: f.text({ label: "Title line 2 (gradient)", max: 80 }),
        description: f.textarea({ label: "Description", max: 600 }),
        primaryCtaLabel: f.text({ label: "Primary button text", max: 40 }),
        primaryCtaHref: f.text({ label: "Primary button link", max: 200 }),
        secondaryCtaLabel: f.text({ label: "Secondary button text", max: 40 }),
        secondaryCtaHref: f.text({ label: "Secondary button link", max: 200 }),
      },
    }),
    stats: f.list({
      label: "Stats",
      group: "Stats",
      itemLabel: "label",
      max: 6,
      of: { value: f.text({ label: "Value", required: true, max: 20, help: 'e.g. "50+"' }), label: f.text({ label: "Label", required: true, max: 60 }) },
    }),
  },
});
