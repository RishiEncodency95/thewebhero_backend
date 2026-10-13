import { Media, IMedia } from "./media.model";
import { safeFolder, storage } from "./storage";
import { ApiError } from "../../common/utils/ApiError";
import { getPagination, buildMeta } from "../../common/utils/pagination";
import { Request } from "express";

export const mediaService = {
  async save(file: Express.Multer.File, uploadedBy: string, folderInput?: string): Promise<IMedia> {
    if (!file) throw ApiError.badRequest("No file uploaded (use the 'file' field)");
    const folder = safeFolder(folderInput);
    const result = await storage.put(file, folder);

    return Media.create({
      fileName: result.publicId.split("/").pop(),
      originalName: file.originalname.slice(0, 200),
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
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
    if (typeof req.query.mimeType === "string") filter.mimeType = { $regex: `^${req.query.mimeType.replace(/[^a-z/+.-]/gi, "")}` };
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    if (search) filter.originalName = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    const [items, total] = await Promise.all([
      Media.find(filter).sort(sort).skip(skip).limit(limit),
      Media.countDocuments(filter),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async remove(id: string): Promise<void> {
    const media = await Media.findById(id);
    if (!media) throw ApiError.notFound("File not found");

    await storage.remove(media.publicId, media.resourceType);

    await media.deleteOne();
  },

  // Re-upload: swaps the file behind an existing Media record. The new file
  // goes live (and the DB record is updated) before the old Cloudinary asset
  // is deleted, so a failed cleanup never leaves the record pointing at a
  // missing file - worst case is a harmless orphaned file.
  async replace(id: string, file: Express.Multer.File): Promise<IMedia> {
    if (!file) throw ApiError.badRequest("No file uploaded (use the 'file' field)");
    const media = await Media.findById(id);
    if (!media) throw ApiError.notFound("File not found");

    const oldPublicId = media.publicId;
    const oldResourceType = media.resourceType;

    const result = await storage.put(file, safeFolder(media.folder));

    media.fileName = result.publicId.split("/").pop() ?? result.publicId;
    media.originalName = file.originalname.slice(0, 200);
    media.url = result.url;
    media.publicId = result.publicId;
    media.resourceType = result.resourceType;
    media.mimeType = file.mimetype;
    media.size = file.size;
    await media.save();

    await storage.remove(oldPublicId, oldResourceType);

    return media;
  },
};
