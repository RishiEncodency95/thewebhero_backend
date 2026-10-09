import { Readable } from "stream";
import { UploadApiResponse } from "cloudinary";
import { Media, IMedia } from "./media.model";
import { ApiError } from "../../common/utils/ApiError";
import { getPagination, buildMeta } from "../../common/utils/pagination";
import { cloudinary, isCloudinaryConfigured } from "../../config/cloudinary";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { Request } from "express";

const uploadBufferToCloudinary = (file: Express.Multer.File, folder: string): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${env.CLOUDINARY_FOLDER}/${folder}`, resource_type: "auto" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(result);
      }
    );
    Readable.from(file.buffer).pipe(stream);
  });
};

// Best-effort delete - a stale Cloudinary asset is a harmless storage leak,
// but a failed request here must never block the caller's main operation.
const destroyCloudinaryAsset = async (publicId: string, resourceType: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch((error) => {
    logger.error(error, `Failed to delete Cloudinary asset ${publicId}`);
  });
};

export const mediaService = {
  async save(file: Express.Multer.File, uploadedBy: string, folder = "general"): Promise<IMedia> {
    if (!isCloudinaryConfigured) {
      throw ApiError.internal(
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env"
      );
    }

    const result = await uploadBufferToCloudinary(file, folder);

    return Media.create({
      fileName: result.public_id.split("/").pop(),
      originalName: file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      mimeType: file.mimetype,
      size: file.size,
      folder,
      uploadedBy,
    });
  },

  async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const filter: Record<string, unknown> = {};
    if (req.query.folder) filter.folder = req.query.folder;
    if (req.query.mimeType) filter.mimeType = { $regex: `^${req.query.mimeType}` };

    const [items, total] = await Promise.all([
      Media.find(filter).sort(sort).skip(skip).limit(limit),
      Media.countDocuments(filter),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async remove(id: string): Promise<void> {
    const media = await Media.findById(id);
    if (!media) throw ApiError.notFound("File not found");

    if (isCloudinaryConfigured) {
      await destroyCloudinaryAsset(media.publicId, media.resourceType);
    }

    await media.deleteOne();
  },

  // Re-upload: swaps the file behind an existing Media record. The new file
  // goes live (and the DB record is updated) before the old Cloudinary asset
  // is deleted, so a failed cleanup never leaves the record pointing at a
  // missing file - worst case is a harmless orphaned file in Cloudinary.
  async replace(id: string, file: Express.Multer.File): Promise<IMedia> {
    if (!isCloudinaryConfigured) {
      throw ApiError.internal(
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env"
      );
    }

    const media = await Media.findById(id);
    if (!media) throw ApiError.notFound("File not found");

    const oldPublicId = media.publicId;
    const oldResourceType = media.resourceType;

    const result = await uploadBufferToCloudinary(file, media.folder ?? "general");

    media.fileName = result.public_id.split("/").pop() ?? result.public_id;
    media.originalName = file.originalname;
    media.url = result.secure_url;
    media.publicId = result.public_id;
    media.resourceType = result.resource_type;
    media.mimeType = file.mimetype;
    media.size = file.size;
    await media.save();

    await destroyCloudinaryAsset(oldPublicId, oldResourceType);

    return media;
  },
};
