import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { isTrustedSiteRequest } from "../utils/siteSecret";

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  // The website renders hundreds of pages from one server IP; it authenticates
  // with the shared site secret instead of being throttled.
  skip: isTrustedSiteRequest,
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
