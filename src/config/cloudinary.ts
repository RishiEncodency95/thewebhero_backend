import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";
import { logger } from "./logger";

// Values copied from .env.example ("your_cloud_name"...) count as not configured.
const real = (v?: string) => Boolean(v && !v.startsWith("your_"));
export const isCloudinaryConfigured = real(env.CLOUDINARY_CLOUD_NAME) && real(env.CLOUDINARY_API_KEY) && real(env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info("Cloudinary configured");
} else {
  logger.warn("Cloudinary not configured - media uploads are stored on local disk (./uploads).");
}

export { cloudinary };
