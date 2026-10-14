// Deletes uploaded files that content no longer uses.
//
// The admin uploads an image to the media library first and then stores its
// URL in a content field. When that field is changed or cleared, or the whole
// record is deleted, the old file would stay in storage forever. After every
// save/delete we diff the URLs the record used before and after, and remove
// any media file that is no longer referenced by ANY content record.

import { FieldMap } from "./fields";
import { contentRegistry } from "./registry";
import { Media } from "../modules/media/media.model";
import { storage } from "../modules/media/storage";
import { logger } from "../config/logger";
import { revalidateFrontend } from "./revalidate";

const URL_RE = /https?:\/\/[^\s"'()<>]+/g;

/** Every http(s) URL inside a value (strings, arrays, nested objects, markdown). */
export function collectUrls(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    for (const m of value.match(URL_RE) ?? []) out.add(m.replace(/[.,;:!?\]]+$/, ""));
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectUrls(v, out));
  } else if (value && typeof value === "object" && !(value instanceof Date)) {
    Object.values(value as Record<string, unknown>).forEach((v) => collectUrls(v, out));
  }
  return out;
}

/** Dotted paths that can hold a media URL: image fields exactly, text fields by substring. */
function mediaPaths(fields: FieldMap, prefix = ""): { exact: string[]; text: string[] } {
  const exact: string[] = [];
  const text: string[] = [];
  for (const [key, field] of Object.entries(fields)) {
    const path = prefix ? `${prefix}.${key}` : key;
    switch (field.type) {
      case "image":
      case "url":
        exact.push(path);
        break;
      case "markdown":
      case "textarea":
        text.push(path);
        break;
      case "seo":
        exact.push(`${path}.ogImage`);
        break;
      case "list":
      case "object": {
        const sub = mediaPaths(field.of, path);
        exact.push(...sub.exact);
        text.push(...sub.text);
        break;
      }
    }
  }
  return { exact, text };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function isStillUsed(url: string): Promise<boolean> {
  for (const def of contentRegistry.all()) {
    const { exact, text } = mediaPaths(def.fields);
    const or = [...exact.map((p) => ({ [p]: url })), ...text.map((p) => ({ [p]: { $regex: escapeRegex(url) } }))];
    if (or.length && (await def.model.exists({ $or: or }))) return true;
  }
  return false;
}

/**
 * Removes media files referenced by `before` but not by `after` (pass null for
 * a deleted record), unless some other content still uses them. Never throws:
 * a failed cleanup must not fail the save that triggered it.
 */
export async function cleanupReplacedMedia(before: unknown, after: unknown): Promise<void> {
  try {
    const still = collectUrls(after);
    const dropped = [...collectUrls(before)].filter((u) => !still.has(u));
    if (!dropped.length) return;

    const media = await Media.find({ url: { $in: dropped } });
    for (const m of media) {
      if (await isStillUsed(m.url)) continue;
      await storage.remove(m.publicId, m.resourceType);
      await m.deleteOne();
      logger.info(`Removed unused media ${m.publicId}`);
    }
  } catch (err) {
    logger.error(err, "Media cleanup failed");
  }
}

/**
 * Points every content record that uses `oldUrl` at `newUrl` (after a media
 * file is replaced, its storage URL changes). Returns how many records changed.
 */
export async function replaceMediaUrl(oldUrl: string, newUrl: string): Promise<number> {
  if (oldUrl === newUrl) return 0;
  let changed = 0;
  const tags: string[] = [];
  for (const def of contentRegistry.all()) {
    const { exact, text } = mediaPaths(def.fields);
    const or = [...exact.map((p) => ({ [p]: oldUrl })), ...text.map((p) => ({ [p]: { $regex: escapeRegex(oldUrl) } }))];
    if (!or.length) continue;
    const docs = await def.model.find({ $or: or });
    for (const doc of docs) {
      const { _id, createdAt, updatedAt, ...data } = doc.toObject(); // eslint-disable-line @typescript-eslint/no-unused-vars
      doc.set(JSON.parse(JSON.stringify(data).split(oldUrl).join(newUrl)));
      await doc.save();
      changed++;
      tags.push(def.resource, typeof data.slug === "string" ? `${def.resource}:${data.slug}` : "");
    }
  }
  revalidateFrontend(tags);
  return changed;
}
