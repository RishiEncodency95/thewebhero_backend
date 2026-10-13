/* eslint-disable no-console */
// One-time migration: copies the website's hard-coded content
// (twh_frontend/app/lib/*.ts) into the CMS so the admin starts with the real
// site content.
//
//   npm run import:content            # insert anything missing, keep existing records
//   npm run import:content -- --force # overwrite existing records with the file data
//
// FRONTEND_DIR overrides the default ../twh_frontend location.
import path from "path";
import { connectDB, disconnectDB } from "../src/config/db";
import { services, solutions, technologies, industries, categories, businessNeeds } from "../src/content/offerings";
import { portfolio, blog, team, careers, testimonials, faqs, locations } from "../src/content/editorial";
import { seoPages, settings, company, homePage } from "../src/content/site";

const FORCE = process.argv.includes("--force");
const FRONTEND = path.resolve(process.env.FRONTEND_DIR ?? path.join(__dirname, "../../twh_frontend"));
const lib = (name: string) => import(path.join(FRONTEND, "app/lib", name));

type Doc = Record<string, unknown>;
type AnyModel = { findOne: (f: Doc) => Promise<unknown>; create: (d: Doc) => Promise<unknown>; replaceOne: (f: Doc, d: Doc) => Promise<unknown> };

const counts: Record<string, { created: number; updated: number; skipped: number }> = {};

async function upsert(label: string, model: AnyModel, key: Doc, data: Doc) {
  counts[label] ??= { created: 0, updated: 0, skipped: 0 };
  const existing = await model.findOne(key);
  if (!existing) {
    await model.create(data);
    counts[label].created++;
  } else if (FORCE) {
    await model.replaceOne(key, data);
    counts[label].updated++;
  } else {
    counts[label].skipped++;
  }
}

// Old files stored SEO flat and used "active" for published.
const seoFrom = (item: Doc) => ({ title: item.seoTitle ?? "", description: item.seoDescription ?? "", ogImage: validImage(item.ogImage) });
const statusFrom = (s: unknown) => (s === "draft" ? "draft" : "published");
const slugs = (refs: unknown) => (Array.isArray(refs) ? refs.map((r) => (typeof r === "string" ? r : (r as Doc)?.slug)).filter(Boolean) : []);
/** The old /projects/*.png paths never existed in public/, so don't carry them over. */
const validImage = (url: unknown) => (typeof url === "string" && url && !url.startsWith("/projects/") ? url : "");

function stripLegacy(item: Doc) {
  const { seoTitle, seoDescription, ogImage, status, id, ...rest } = item; // eslint-disable-line @typescript-eslint/no-unused-vars
  return rest;
}

async function importOfferings() {
  const svc = await lib("services.ts");
  for (const [i, s] of (svc.getAllServices() as Doc[]).entries()) {
    await upsert("services", services.Model, { slug: s.slug }, {
      ...stripLegacy(s),
      heroImage: validImage(s.heroImage),
      relatedServices: slugs(s.relatedServices),
      seo: seoFrom(s),
      status: statusFrom(s.status),
      sortOrder: i,
    });
  }
  for (const [i, c] of (svc.SERVICE_CATEGORIES as Doc[]).entries()) {
    await upsert("categories", categories.Model, { type: "services", slug: c.slug }, { type: "services", name: c.name, slug: c.slug, description: c.description, iconName: c.iconName, status: "published", sortOrder: i });
  }

  const sol = await lib("solutions.ts");
  for (const [i, s] of (sol.getAllSolutions() as Doc[]).entries()) {
    await upsert("solutions", solutions.Model, { slug: s.slug }, {
      ...stripLegacy(s),
      heroImage: validImage(s.heroImage),
      relatedServices: slugs(s.relatedServices),
      relatedSolutions: slugs(s.relatedSolutions),
      seo: seoFrom(s),
      status: statusFrom(s.status),
      sortOrder: i,
    });
  }
  for (const [i, c] of (sol.SOLUTION_CATEGORIES as Doc[]).entries()) {
    await upsert("categories", categories.Model, { type: "solutions", slug: c.slug }, { type: "solutions", name: c.name, slug: c.slug, description: c.description, iconName: c.iconName, status: "published", sortOrder: i });
  }
  for (const [i, n] of (sol.BUSINESS_NEED_MAPPINGS as Doc[]).entries()) {
    await upsert("business-needs", businessNeeds.Model, { needTitle: n.needTitle }, {
      needTitle: n.needTitle,
      needDescription: n.needDescription,
      iconName: n.iconName,
      solutions: slugs(n.solutions),
      status: "published",
      sortOrder: i,
    });
  }

  const tech = await lib("technologies.ts");
  for (const [i, t] of (tech.getAllTechnologies() as Doc[]).entries()) {
    await upsert("technologies", technologies.Model, { slug: t.slug }, {
      ...stripLegacy(t),
      heroImage: validImage(t.heroImage),
      relatedServices: slugs(t.relatedServices),
      relatedSolutions: slugs(t.relatedSolutions),
      relatedTechnologies: slugs(t.relatedTechnologies),
      seo: seoFrom(t),
      status: statusFrom(t.status),
      sortOrder: i,
    });
  }
  for (const [i, c] of (tech.TECH_CATEGORIES as Doc[]).entries()) {
    await upsert("categories", categories.Model, { type: "technologies", slug: c.slug }, { type: "technologies", name: c.name, slug: c.slug, description: c.description, iconName: c.iconName, status: "published", sortOrder: i });
  }

  const ind = await lib("industries.ts");
  for (const [i, t] of (ind.getAllIndustries() as Doc[]).entries()) {
    await upsert("industries", industries.Model, { slug: t.slug }, {
      ...stripLegacy(t),
      heroImage: validImage(t.heroImage),
      relatedServices: slugs(t.relatedServices),
      relatedSolutions: slugs(t.relatedSolutions),
      relatedTechnologies: slugs(t.relatedTechnologies),
      relatedIndustries: slugs(t.relatedIndustries),
      seo: seoFrom(t),
      status: statusFrom(t.status),
      sortOrder: i,
    });
  }
  for (const [i, c] of (ind.INDUSTRY_CATEGORIES as Doc[]).entries()) {
    await upsert("categories", categories.Model, { type: "industries", slug: c.slug }, { type: "industries", name: c.name, slug: c.slug, description: c.description, iconName: c.iconName, status: "published", sortOrder: i });
  }
}

async function importEditorial() {
  const pf = await lib("portfolio.ts");
  for (const [i, p] of (pf.portfolioProjects as Doc[]).entries()) {
    const { relatedProjectSlugs, sortOrder, ...rest } = stripLegacy(p); // eslint-disable-line @typescript-eslint/no-unused-vars
    await upsert("portfolio", portfolio.Model, { slug: p.slug }, {
      ...rest,
      coverImage: validImage(p.coverImage),
      gallery: ((p.gallery as Doc[]) ?? []).filter((g) => validImage(g.url)),
      relatedProjects: relatedProjectSlugs ?? [],
      seo: seoFrom(p),
      status: statusFrom(p.status),
      sortOrder: typeof sortOrder === "number" ? sortOrder : i,
    });
  }

  const res = await lib("resources.ts");
  for (const [i, b] of (res.getAllResources() as Doc[]).filter((r) => r.type === "blog").entries()) {
    await upsert("blog", blog.Model, { slug: b.slug }, {
      title: b.title,
      slug: b.slug,
      subtitle: b.subtitle,
      excerpt: b.excerpt ?? b.description,
      content: b.content ?? b.description ?? "",
      coverImage: validImage(b.coverImage),
      coverImageAlt: b.coverImageAlt,
      category: b.category,
      categorySlug: b.categorySlug,
      topics: b.topics ?? [],
      publishedAt: b.publishedAt,
      lastUpdated: b.updatedAt ?? "",
      readingTime: b.readingTime,
      author: b.author ?? {},
      relatedServices: slugs(b.services),
      relatedTechnologies: slugs(b.technologies),
      featured: Boolean(b.featured),
      seo: seoFrom(b),
      status: statusFrom(b.status),
      sortOrder: i,
    });
  }

  const co = await lib("company.ts");
  for (const [i, m] of (co.teamMembers as Doc[]).entries()) {
    const links = (m.socialLinks ?? {}) as Doc;
    // Bare site roots ("https://linkedin.com/") were placeholders - drop them.
    const real = (u: unknown) => (typeof u === "string" && /^https?:\/\/[^/]+\/.+/.test(u) ? u : "");
    await upsert("team", team.Model, { slug: m.slug }, {
      ...stripLegacy(m),
      photo: m.photo,
      socialLinks: { linkedin: real(links.linkedin), github: real(links.github), twitter: real(links.twitter) },
      seo: {},
      status: statusFrom(m.status),
      sortOrder: typeof m.sortOrder === "number" ? m.sortOrder : i,
    });
  }
  for (const [i, j] of (co.jobPositions as Doc[]).entries()) {
    await upsert("careers", careers.Model, { slug: j.slug }, {
      ...stripLegacy(j),
      employmentType: j.employmentType,
      closed: j.status === "closed",
      seo: {},
      status: j.status === "draft" ? "draft" : "published",
      sortOrder: i,
    });
  }

  const info = co.companyData as Doc;
  await saveSingleton("company", company.Model, {
    name: info.name,
    tagline: info.tagline,
    story: info.story,
    mission: info.mission,
    vision: info.vision,
    capabilities: info.capabilities,
    values: info.values,
    culture: co.culturePrinciples,
    process: co.processSteps,
  });

  const loc = await lib("locationsData.ts");
  for (const [i, c] of (loc.TOP_CITIES as Doc[]).entries()) {
    await upsert("locations", locations.Model, { slug: c.slug }, { name: c.name, slug: c.slug, type: "city", seo: {}, status: "published", sortOrder: i });
  }
  for (const [i, c] of (loc.TOP_COUNTRIES as Doc[]).entries()) {
    await upsert("locations", locations.Model, { slug: c.slug }, { name: c.name, slug: c.slug, type: "country", seo: {}, status: "published", sortOrder: i });
  }
}

async function saveSingleton(label: string, model: AnyModel, data: Doc) {
  await upsert(label, model, { key: "main" }, { key: "main", ...data });
}

// Copied from the hard-coded home page components.
const HOME_FAQS = [
  ["What services do you provide?", "We provide web development, mobile app development, custom software, cloud & DevOps, UI/UX design, and 24/7 IT support solutions."],
  ["How much does a project cost?", "Costs depend on scope, complexity, and timelines. We offer flexible engagement models tailored to startups and enterprises."],
  ["How long does a project take?", "Small projects take 2–4 weeks, while comprehensive enterprise software or custom platforms take 2–3 months."],
  ["Do you provide maintenance and support?", "Yes, we offer ongoing 24/7 technical support, server maintenance, security patches, and feature updates."],
  ["Do you work with startups?", "Absolutely. We help startups build MVPs, scale infrastructure, and grow rapidly from the ground up."],
];
const QUOTE_FAQS = [
  ["What information should I include in my quote request?", "The more detail you provide about your business goals, target platforms, required features, and budget expectations, the more precise our scope and architectural recommendation will be."],
  ["Is my project concept kept confidential?", "Yes. All project specifications, designs, and business workflows submitted through our quote form are treated with strict confidentiality."],
  ["What if I do not have complete technical specifications yet?", "That is completely normal. Our team can help convert high-level product ideas into detailed technical architecture and user stories during the initial scoping call."],
  ["What happens after I submit this quote request?", "Our engineering lead will evaluate your project scope, verify feasibility, and reach out via your preferred contact method to discuss milestone phases and technical recommendations."],
  ["Does submitting a quote request bind me to any financial commitment?", "No. Quote submissions are entirely free and non-binding inquiry assessments designed to help you plan your project requirements."],
];
// The home page shipped with sample testimonials. Imported as DRAFTS so they
// never go live until replaced with real, approved client quotes.
const SAMPLE_TESTIMONIALS = [
  { quote: "Working with TheWebHero was a smooth experience. Their IT support and cloud migration saved us hundreds of server downtime hours.", authorName: "Ananya Sharma", authorRole: "CTO", companyName: "GlobalLogix", rating: 5 },
  { quote: "TheWebHero delivered our platform exactly as we envisioned. Professional team, on-time delivery and excellent communication throughout the project.", authorName: "Rohit Mehta", authorRole: "Founder", companyName: "TechNova", rating: 5 },
];

// Current metadata of every fixed page, taken from each page.tsx.
const PAGE_SEO: { path: string; label: string; title: string; description: string; priority?: number }[] = [
  { path: "/", label: "Home", priority: 1, title: "TheWebHero | Web, Mobile App & Custom Software Development Company", description: "TheWebHero builds custom websites, web apps, mobile apps and business software for startups and growing companies. Get a free project consultation." },
  { path: "/services", label: "Services", title: "Services Directory | TheWebHero IT & Software Engineering", description: "Explore complete software development, mobile apps, cloud DevOps, database solutions, custom software, and IT infrastructure support services by TheWebHero." },
  { path: "/solutions", label: "Solutions", title: "Business Solutions Directory | TheWebHero Enterprise Solutions", description: "Explore digital transformation, business automation, startup MVPs, SaaS development, enterprise software, CRM, ERP, and eCommerce solutions by TheWebHero." },
  { path: "/technologies", label: "Technologies", title: "Technologies Directory | TheWebHero Engineering Ecosystem", description: "Explore the complete technology stack used by TheWebHero: React, Next.js, Node.js, Flutter, MongoDB, AWS, Docker, Kubernetes, AI, and Shopify." },
  { path: "/industries", label: "Industries", title: "Industries We Serve | TheWebHero Software Solutions", description: "Explore software engineering solutions tailored for Healthcare, FinTech, Education, eCommerce, Real Estate, Logistics, SaaS, and Enterprise sectors by TheWebHero." },
  { path: "/portfolio", label: "Portfolio", title: "Portfolio | Web & Mobile Apps Built by TheWebHero", description: "See live web platforms, booking apps, admin dashboards and Flutter mobile apps designed and built end to end by TheWebHero." },
  { path: "/blog", label: "Blog", title: "Blog | TheWebHero", description: "Technical insights, engineering best practices, web architecture and mobile development articles from the TheWebHero team." },
  { path: "/company", label: "Company", title: "Company | About TheWebHero, Team & Engineering Process", description: "Learn about TheWebHero, our software engineering team, delivery process, core values, culture, and career opportunities." },
  { path: "/company/about", label: "About Us", title: "About Us | TheWebHero Story, Mission & Engineering Values", description: "Learn about TheWebHero company background, software engineering mission, core values, and development capabilities." },
  { path: "/company/why-us", label: "Why Us", title: "Why Choose TheWebHero | Technical Differentiators & Quality Practices", description: "Discover why ambitious companies partner with TheWebHero for custom web applications, Flutter mobile apps, and enterprise software engineering." },
  { path: "/company/process", label: "Our Process", title: "Our Software Development Process | TheWebHero", description: "A transparent 8-step software engineering process — from discovery and design to development, QA, deployment and ongoing support." },
  { path: "/company/culture", label: "Culture", title: "Company Culture & Engineering Principles | TheWebHero", description: "Learn about working culture, deep work principles, continuous learning, and software craftsmanship at TheWebHero." },
  { path: "/company/team", label: "Our Team", title: "Our Team | TheWebHero Engineers & Leadership", description: "Meet the technical leadership driving software craftsmanship, code quality, and application development at TheWebHero." },
  { path: "/company/careers", label: "Careers", title: "Careers at TheWebHero | Software Engineering Jobs", description: "Explore engineering job openings, remote work opportunities, and software developer roles at TheWebHero." },
  { path: "/contact", label: "Contact", title: "Contact Us | Start Your Web or Mobile Project | TheWebHero", description: "Get in touch with TheWebHero engineering team to discuss custom web applications, Flutter mobile apps, or backend REST APIs." },
  { path: "/get-a-quote", label: "Get a Quote", title: "Get a Project Quote | TheWebHero", description: "Request a custom project quote for web development, mobile apps, SaaS platforms, or enterprise software solutions. Share your requirements and get a detailed scope assessment." },
  { path: "/privacy-policy", label: "Privacy Policy", priority: 0.3, title: "Privacy Policy | TheWebHero", description: "Learn how TheWebHero collects, uses, protects, and handles your personal data and project inquiry information." },
  { path: "/terms-and-conditions", label: "Terms & Conditions", priority: 0.3, title: "Terms & Conditions | TheWebHero", description: "Terms and conditions governing the use of TheWebHero website, quote inquiry workflow, and digital engineering services." },
];

async function importSite() {
  for (const [i, [question, answer]] of HOME_FAQS.entries()) {
    await upsert("faqs", faqs.Model, { page: "home", question }, { page: "home", question, answer, status: "published", sortOrder: i });
  }
  for (const [i, [question, answer]] of QUOTE_FAQS.entries()) {
    await upsert("faqs", faqs.Model, { page: "get-a-quote", question }, { page: "get-a-quote", question, answer, status: "published", sortOrder: i });
  }
  for (const [i, t] of SAMPLE_TESTIMONIALS.entries()) {
    await upsert("testimonials", testimonials.Model, { authorName: t.authorName }, { ...t, status: "draft", sortOrder: i });
  }
  for (const [i, p] of PAGE_SEO.entries()) {
    await upsert("seo-pages", seoPages.Model, { path: p.path }, {
      path: p.path,
      label: p.label,
      seo: { title: p.title, description: p.description },
      sitemap: { priority: p.priority ?? 0.7, changefreq: "weekly" },
      status: "published",
      sortOrder: i,
    });
  }

  const site = await lib("site.ts");
  await saveSingleton("settings", settings.Model, {
    siteName: site.SITE.name,
    tagline: site.SITE.tagline,
    titleTemplate: `%s | ${site.SITE.name}`,
    defaultTitle: `${site.SITE.name} - IT Services Company`,
    defaultDescription: site.SITE.description,
    defaultOgImage: "/og-image.jpg",
    contact: { ...site.CONTACT, phoneHref: undefined },
    social: site.SOCIAL,
    organization: { legalName: site.SITE.legalName, founded: site.SITE.founded, description: site.SITE.description },
  });

  await saveSingleton("home-page", homePage.Model, {
    hero: {
      eyebrow: "Your Technology Partner",
      titleLine1: "Ideas. Solutions. Real",
      titleLine2: "Impact.",
      description:
        "We build powerful digital experiences, intelligent software, cutting-edge AI, and scalable cloud & IT solutions designed to accelerate growth and transform modern businesses into market leaders. From concept to execution, we deliver end-to-end technology solutions.",
      primaryCtaLabel: "Start a Project",
      primaryCtaHref: "/get-a-quote",
      secondaryCtaLabel: "Explore Services",
      secondaryCtaHref: "/services",
    },
    stats: [
      { value: "50+", label: "Projects Delivered" },
      { value: "20+", label: "Technologies" },
      { value: "15+", label: "Business Solutions" },
      { value: "98%", label: "Client Satisfaction" },
    ],
  });
}

(async () => {
  console.log(`Importing website content from ${FRONTEND}${FORCE ? " (overwriting existing records)" : ""}…`);
  await connectDB();
  try {
    await importOfferings();
    await importEditorial();
    await importSite();
    console.table(counts);
  } finally {
    await disconnectDB();
  }
})().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
