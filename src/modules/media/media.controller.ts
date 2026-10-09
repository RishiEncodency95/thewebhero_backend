import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { ApiError } from "../../common/utils/ApiError";
import { mediaService } from "./media.service";

export const mediaController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("No file uploaded");
    if (!req.user) throw ApiError.unauthorized();

    const media = await mediaService.save(req.file, req.user.sub, req.body.folder);
    res.status(201).json(new ApiResponse(201, media, "File uploaded"));
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await mediaService.getAll(req);
    res.status(200).json(new ApiResponse(200, result));
  }),

  replace: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("No file uploaded");
    const media = await mediaService.replace(req.params.id, req.file);
    res.status(200).json(new ApiResponse(200, media, "File replaced"));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await mediaService.remove(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "File deleted"));
  }),
};
