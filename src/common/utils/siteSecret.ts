import { timingSafeEqual } from "crypto";
import { Request } from "express";
import { env } from "../../config/env";

/**
 * True when the request comes from the website's own server (it sends the
 * shared REVALIDATE_SECRET in `x-site-secret`). Used to exempt server-side
 * page rendering from per-IP rate limits. Browsers never see this secret.
 */
export function isTrustedSiteRequest(req: Request): boolean {
  const given = req.get("x-site-secret");
  const expected = env.REVALIDATE_SECRET;
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
