// Resource keys map 1:1 to the admin sidebar modules (twh_admin/src/app/dashboard/*)
export const RESOURCES = [
  "users",
  "roles",
  "audit-logs",
  "media",
  "notifications",
  "settings",
  "home-page",
  "pages",
  "blog",
  "portfolio",
  "case-studies",
  "services",
  "solutions",
  "industries",
  "technologies",
  "locations",
  "team",
  "testimonials",
  "partners",
  "awards",
  "faqs",
  "resources",
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
