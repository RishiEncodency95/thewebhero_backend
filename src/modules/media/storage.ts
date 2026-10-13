import { Readable } from "stream";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { cloudinary, isCloudinaryConfigured } from "../../config/cloudinary";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

export interface StoredFile {
  url: string;
  publicId: string;
  resourceType: string;
}

/** Where uploaded files live. Cloudinary when configured, otherwise local disk. */
export interface MediaStorage {
  readonly name: "cloudinary" | "local";
  put(file: Express.Multer.File, folder: string): Promise<StoredFile>;
  /** Best-effort: never throws, a leftover file is a harmless storage leak. */
  remove(publicId: string, resourceType: string): Promise<void>;
}

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

/** "Blog Covers/../x" -> "blog-covers-x". Keeps folder names safe as path segments. */
export const safeFolder = (folder?: string) =>
  (folder ?? "general").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "general";

const cloudinaryStorage: MediaStorage = {
  name: "cloudinary",
  put(file, folder) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `${env.CLOUDINARY_FOLDER}/${folder}`, resource_type: "auto" },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
          resolve({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type });
        }
      );
      Readable.from(file.buffer).pipe(stream);
    });
  },
  async remove(publicId, resourceType) {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch((err) => {
      logger.error(err, `Failed to delete Cloudinary asset ${publicId}`);
    });
  },
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

const localStorage: MediaStorage = {
  name: "local",
  async put(file, folder) {
    const dir = path.join(UPLOAD_DIR, folder);
    await fs.mkdir(dir, { recursive: true });
    // Random names: never trust the uploaded file name on disk.
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}${EXTENSIONS[file.mimetype] ?? ""}`;
    await fs.writeFile(path.join(dir, name), file.buffer);
    const base = (env.PUBLIC_API_URL ?? `http://localhost:${env.PORT}`).replace(/\/$/, "");
    return { url: `${base}/uploads/${folder}/${name}`, publicId: `${folder}/${name}`, resourceType: file.mimetype.startsWith("image/") ? "image" : "raw" };
  },
  async remove(publicId) {
    const target = path.resolve(UPLOAD_DIR, publicId);
    if (!target.startsWith(UPLOAD_DIR + path.sep)) return; // never delete outside uploads/
    await fs.unlink(target).catch(() => undefined);
  },
};

export const storage: MediaStorage = isCloudinaryConfigured ? cloudinaryStorage : localStorage;
