import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { Request } from "express";
import { isTrustedSiteRequest } from "../utils/siteSecret";
import { verifyAccessToken } from "../utils/tokens";

/** Signed-in staff (valid access token) - the admin fires many requests per screen. */
function isAuthenticatedStaff(req: Request): boolean {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  try {
    verifyAccessToken(header.slice(7));
    return true;
  } catch {
    return false;
  }
}

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  // The website renders hundreds of pages from one server IP (shared site
  // secret) and signed-in admins load many records per screen - neither is
  // throttled. Anonymous traffic still is.
  skip: (req) => isTrustedSiteRequest(req) || isAuthenticatedStaff(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// Stricter limiter for auth endpoints (login, forgot-password) to slow down brute-force.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later." },
});

// Public lead-capture forms (contact/quote/support/newsletter) - prevent spam bots.
export const publicFormRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions, please try again later." },
});
