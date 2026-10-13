// Services, solutions, technologies and industries: the four "offering"
// catalogues of the website. Fields mirror twh_frontend/app/types/*.ts.
import { defineContentModule } from "../cms/contentModule";
import { f, faqItem, integrationItem, processStepItem, titleDescriptionItem } from "../cms/fields";

const B = "Basics";
const C = "Content";
const D = "Details";
const R = "Related";

const catalogueBasics = (titleKey: "title" | "name") => ({
  [titleKey]: f.text({ label: titleKey === "title" ? "Title" : "Name", required: true, max: 200, group: B }),
  slug: f.slug({ label: "URL slug", from: titleKey, group: B, help: "Leave empty to generate from the title." }),
  category: f.text({ label: "Category name", max: 120, group: B }),
  categorySlug: f.text({ label: "Category slug", max: 120, group: B, help: "Must match a Category's slug." }),
  iconName: f.icon({ label: "Icon", group: B, help: "Lucide icon name, e.g. Code2" }),
  heroImage: f.image({ label: "Hero image", group: B }),
  shortDescription: f.textarea({ label: "Short description", required: true, max: 400, rows: 2, group: B }),
  description: f.textarea({ label: "Full description", max: 5000, rows: 5, group: C }),
});

const summaryFields = (titleKey: string) => [titleKey, "slug", "category", "categorySlug", "iconName", "shortDescription", "heroImage"];

export const services = defineContentModule({
  resource: "services",
  modelName: "Service",
  label: "Service",
  labelPlural: "Services",
  description: "Service pages under /services.",
  summaryField: "shortDescription",
  imageField: "heroImage",
  listColumns: ["title", "category", "status", "featured"],
  searchable: ["title", "shortDescription", "category"],
  filterable: ["categorySlug", "category"],
  summaryFields: summaryFields("title"),
  publicPath: (d) => `/services/${d.slug}`,
  sitemap: { priority: 0.9, changefreq: "weekly" },
  fields: {
    ...catalogueBasics("title"),
    problemStatement: f.textarea({ label: "Problem statement", max: 3000, group: C }),
    capabilities: f.list({ label: "Capabilities", group: C, itemLabel: "title", of: { ...titleDescriptionItem(), iconName: f.icon("Icon") } }),
    subServices: f.list({
      label: "Sub-services",
      group: C,
      itemLabel: "title",
      of: { title: f.text({ label: "Title", required: true, max: 200 }), slug: f.text({ label: "Slug", max: 160 }), description: f.textarea("Description") },
    }),
    technologies: f.list({
      label: "Technologies used",
      group: D,
      itemLabel: "name",
      of: { name: f.text({ label: "Name", required: true, max: 120 }), category: f.text("Category"), iconName: f.icon("Icon") },
    }),
    deliverables: f.stringList({ label: "Deliverables", group: D }),
    process: f.list({ label: "Process", group: D, itemLabel: "title", of: processStepItem }),
    benefits: f.list({ label: "Benefits", group: D, itemLabel: "title", of: titleDescriptionItem() }),
    faqs: f.list({ label: "FAQs", group: D, itemLabel: "question", of: faqItem }),
    relatedServices: f.refs({ label: "Related services", resource: "services", group: R, max: 12 }),
    seo: f.seo(),
  },
});

export const solutions = defineContentModule({
  resource: "solutions",
  modelName: "Solution",
  label: "Solution",
  labelPlural: "Solutions",
  description: "Solution pages under /solutions.",
  summaryField: "shortDescription",
  imageField: "heroImage",
  listColumns: ["title", "category", "status", "featured"],
  searchable: ["title", "shortDescription", "category"],
  filterable: ["categorySlug", "category"],
  summaryFields: summaryFields("title"),
  publicPath: (d) => `/solutions/${d.slug}`,
  sitemap: { priority: 0.9, changefreq: "weekly" },
  fields: {
    ...catalogueBasics("title"),
    challenges: f.list({ label: "Challenges solved", group: C, itemLabel: "title", of: titleDescriptionItem() }),
    capabilities: f.list({ label: "Capabilities", group: C, itemLabel: "title", of: { ...titleDescriptionItem(), iconName: f.icon("Icon") } }),
    audience: f.list({ label: "Who it's for", group: C, itemLabel: "title", of: titleDescriptionItem() }),
    features: f.list({ label: "Features", group: C, itemLabel: "title", of: titleDescriptionItem() }),
    technologies: f.list({
      label: "Technologies",
      group: D,
      itemLabel: "name",
      of: { name: f.text({ label: "Name", required: true, max: 120 }), category: f.text("Category") },
    }),
    integrations: f.list({ label: "Integrations", group: D, itemLabel: "name", of: integrationItem }),
    process: f.list({ label: "Process", group: D, itemLabel: "title", of: processStepItem }),
    benefits: f.list({ label: "Benefits", group: D, itemLabel: "title", of: titleDescriptionItem() }),
    security: f.stringList({ label: "Security points", group: D }),
    scalability: f.stringList({ label: "Scalability points", group: D }),
    faqs: f.list({ label: "FAQs", group: D, itemLabel: "question", of: faqItem }),
    relatedServices: f.refs({ label: "Related services", resource: "services", group: R, max: 12 }),
    relatedSolutions: f.refs({ label: "Related solutions", resource: "solutions", group: R, max: 12 }),
    seo: f.seo(),
  },
});

export const technologies = defineContentModule({
  resource: "technologies",
  modelName: "Technology",
  label: "Technology",
  labelPlural: "Technologies",
  description: "Technology pages under /technologies.",
  titleField: "name",
  summaryField: "shortDescription",
  imageField: "heroImage",
  listColumns: ["name", "category", "status", "featured"],
  searchable: ["name", "keyword", "shortDescription", "category"],
  filterable: ["categorySlug", "category"],
  summaryFields: [...summaryFields("name"), "keyword"],
  publicPath: (d) => `/technologies/${d.slug}`,
  sitemap: { priority: 0.8, changefreq: "weekly" },
  fields: {
    ...catalogueBasics("name"),
    keyword: f.text({ label: "Primary keyword", max: 120, group: B, help: 'Drives the H1 and title, e.g. "React Development".' }),
    role: f.text({ label: "Role hired", max: 120, group: B, help: 'e.g. "React developers"' }),
    overview: f.textarea({ label: "Overview", max: 5000, rows: 5, group: C }),
    useCases: f.list({ label: "Use cases", group: C, itemLabel: "title", of: titleDescriptionItem() }),
    capabilities: f.list({ label: "Capabilities", group: C, itemLabel: "title", of: titleDescriptionItem() }),
    features: f.list({ label: "Features", group: C, itemLabel: "title", of: titleDescriptionItem() }),
    ecosystem: f.list({
      label: "Ecosystem",
      group: D,
      itemLabel: "name",
      of: { name: f.text({ label: "Name", required: true, max: 120 }), category: f.text("Category"), description: f.textarea("Description") },
    }),
    integrations: f.list({ label: "Integrations", group: D, itemLabel: "name", of: integrationItem }),
    process: f.list({ label: "Process", group: D, itemLabel: "title", of: processStepItem }),
    security: f.stringList({ label: "Security points", group: D }),
    scalability: f.stringList({ label: "Scalability points", group: D }),
    faqs: f.list({ label: "FAQs", group: D, itemLabel: "question", of: faqItem }),
    relatedServices: f.refs({ label: "Related services", resource: "services", group: R, max: 12 }),
    relatedSolutions: f.refs({ label: "Related solutions", resource: "solutions", group: R, max: 12 }),
    relatedTechnologies: f.refs({ label: "Related technologies", resource: "technologies", group: R, max: 12 }),
    seo: f.seo(),
  },
});

export const industries = defineContentModule({
  resource: "industries",
  modelName: "Industry",
  label: "Industry",
  labelPlural: "Industries",
  description: "Industry pages under /industries.",
  titleField: "name",
  summaryField: "shortDescription",
  imageField: "heroImage",
  listColumns: ["name", "category", "status", "featured"],
  searchable: ["name", "keyword", "shortDescription", "category"],
  filterable: ["categorySlug", "category"],
  summaryFields: [...summaryFields("name"), "keyword"],
  publicPath: (d) => `/industries/${d.slug}`,
  sitemap: { priority: 0.8, changefreq: "weekly" },
  fields: {
    ...catalogueBasics("name"),
    keyword: f.text({ label: "Primary keyword", max: 120, group: B, help: 'e.g. "Healthcare Software Development"' }),
    overview: f.textarea({ label: "Overview", max: 5000, rows: 5, group: C }),
    challenges: f.list({
      label: "Industry challenges",
      group: C,
      itemLabel: "title",
      of: { ...titleDescriptionItem(), techNeed: f.textarea({ label: "Technology need", max: 1000 }) },
    }),
    capabilities: f.list({ label: "Capabilities", group: C, itemLabel: "title", of: titleDescriptionItem() }),
    features: f.list({ label: "Features", group: C, itemLabel: "title", of: titleDescriptionItem() }),
    integrations: f.list({ label: "Integrations", group: D, itemLabel: "name", of: integrationItem }),
    process: f.list({ label: "Process", group: D, itemLabel: "title", of: processStepItem }),
    security: f.stringList({ label: "Security points", group: D }),
    compliance: f.stringList({ label: "Compliance", group: D }),
    scalability: f.stringList({ label: "Scalability points", group: D }),
    faqs: f.list({ label: "FAQs", group: D, itemLabel: "question", of: faqItem }),
    relatedServices: f.refs({ label: "Related services", resource: "services", group: R, max: 12 }),
    relatedSolutions: f.refs({ label: "Related solutions", resource: "solutions", group: R, max: 12 }),
    relatedTechnologies: f.refs({ label: "Related technologies", resource: "technologies", group: R, max: 12 }),
    relatedIndustries: f.refs({ label: "Related industries", resource: "industries", group: R, max: 12 }),
    seo: f.seo(),
  },
});

// Category groups shown on the /services, /solutions, /technologies and /industries hubs.
export const categories = defineContentModule({
  resource: "categories",
  modelName: "Category",
  label: "Category",
  labelPlural: "Categories",
  description: "Groups that organise services, solutions, technologies and industries.",
  titleField: "name",
  slugField: null,
  listColumns: ["name", "type", "slug", "status"],
  searchable: ["name", "slug"],
  filterable: ["type"],
  defaultStatus: "published",
  extraRevalidateTags: ["services", "solutions", "technologies", "industries"],
  fields: {
    type: f.select({
      label: "Catalogue",
      required: true,
      options: [
        { value: "services", label: "Services" },
        { value: "solutions", label: "Solutions" },
        { value: "technologies", label: "Technologies" },
        { value: "industries", label: "Industries" },
      ],
    }),
    name: f.text({ label: "Name", required: true, max: 120 }),
    slug: f.text({ label: "Slug", required: true, max: 120, help: "Items join this category through their Category slug." }),
    description: f.textarea({ label: "Description", max: 1000 }),
    iconName: f.icon("Icon"),
  },
});

// "Business need → solutions" mapping on the /solutions hub.
export const businessNeeds = defineContentModule({
  resource: "business-needs",
  modelName: "BusinessNeed",
  label: "Business need",
  labelPlural: "Business needs",
  description: "Needs shown on the Solutions page, each linked to matching solutions.",
  titleField: "needTitle",
  slugField: null,
  listColumns: ["needTitle", "status"],
  searchable: ["needTitle"],
  defaultStatus: "published",
  extraRevalidateTags: ["solutions"],
  fields: {
    needTitle: f.text({ label: "Need", required: true, max: 200 }),
    needDescription: f.textarea({ label: "Description", max: 1000 }),
    iconName: f.icon("Icon"),
    solutions: f.refs({ label: "Matching solutions", resource: "solutions", max: 8 }),
  },
});
