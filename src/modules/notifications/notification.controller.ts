import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { ApiError } from "../../common/utils/ApiError";
import { notificationService } from "./notification.service";

export const notificationController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await notificationService.getForUser(req, req.user.sub);
    res.status(200).json(new ApiResponse(200, result));
  }),

  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await notificationService.markAsRead(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse(200, null, "Marked as read"));
  }),

  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await notificationService.markAllAsRead(req.user.sub);
    res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
  }),
};
