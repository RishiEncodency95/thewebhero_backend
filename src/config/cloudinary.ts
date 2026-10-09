import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";
import { logger } from "./logger";

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info("Cloudinary configured");
} else {
  logger.warn(
    "Cloudinary credentials missing (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET) - media uploads will fail until configured."
  );
}

export { cloudinary };
