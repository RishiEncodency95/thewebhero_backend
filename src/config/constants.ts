// Resource keys map 1:1 to API routes and admin modules. Permissions are "<resource>:<action>".
export const RESOURCES = [
  // System
  "users",
  "roles",
  "audit-logs",
  "media",
  "notifications",
  // Site-wide singletons
  "settings",
  "company",
  "home-page",
  // SEO
  "seo-pages",
  // Website content
  "services",
  "solutions",
  "technologies",
  "industries",
  "categories",
  "business-needs",
  "portfolio",
  "blog",
  "team",
  "careers",
  "testimonials",
  "faqs",
  "locations",
  // Leads
  "contact-enquiries",
  "quote-requests",
  "support-requests",
  "newsletter",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["create", "read", "update", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

export const DEFAULT_ROLES = {
  SUPER_ADMIN: "super-admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export const COOKIE_NAMES = {
  REFRESH_TOKEN: "twh_refresh_token",
} as const;
