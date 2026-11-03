import { Readable } from "stream";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { cloudinary, isCloudinaryConfigured } from "../../config/cloudinary";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { ApiError } from "../../common/utils/ApiError";

export interface StoredFile {
  url: string;
  publicId: string;
  resourceType: string;
}

/** Where uploaded files live: always Cloudinary. Local disk is only used by the test suite. */
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
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
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

// Uploads never fall back to the server's disk: a redeploy or a deleted folder
// would lose them. Without Cloudinary, uploading fails with a clear message.
const unconfiguredStorage: MediaStorage = {
  name: "cloudinary",
  async put() {
    throw new ApiError(503, "Image uploads need Cloudinary. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.");
  },
  async remove(publicId) {
    logger.warn(`Cloudinary not configured; could not delete ${publicId}`);
  },
};

/** True only in the automated tests, which run without Cloudinary. */
export const usesLocalDisk = !isCloudinaryConfigured && env.NODE_ENV === "test";

export const storage: MediaStorage = isCloudinaryConfigured ? cloudinaryStorage : usesLocalDisk ? localStorage : unconfiguredStorage;
