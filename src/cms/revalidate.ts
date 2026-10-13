import { env, isTest } from "../config/env";
import { logger } from "../config/logger";

const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 2_000;

async function post(tags: string[]): Promise<void> {
  const res = await fetch(`${env.CLIENT_URL.replace(/\/$/, "")}/api/revalidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET! },
    body: JSON.stringify({ tags }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// Tells the Next.js website to drop cached pages for these tags, so admin
// edits go live within seconds (on-demand ISR). Never blocks or fails the
// admin request: if both attempts fail, the page still refreshes on its
// hourly ISR timer.
export function revalidateFrontend(tags: string[]): void {
  if (isTest || !env.REVALIDATE_SECRET || !tags.length) return;
  const unique = [...new Set(tags)].filter(Boolean).slice(0, 64);

  post(unique)
    .catch(async () => {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return post(unique);
    })
    .catch((err) => logger.warn({ err: (err as Error).message, tags: unique }, "Frontend revalidation failed"));
}
