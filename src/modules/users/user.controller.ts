import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { userService } from "./user.service";
import { ApiError } from "../../common/utils/ApiError";

export const userController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create(req.body);
    res.status(201).json(new ApiResponse(201, user, "User created"));
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.getAll(req);
    res.status(200).json(new ApiResponse(200, result));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.params.id);
    res.status(200).json(new ApiResponse(200, user));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, user, "User updated"));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await userService.remove(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse(200, null, "User deleted"));
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await userService.getById(req.user.sub);
    res.status(200).json(new ApiResponse(200, user));
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await userService.update(req.user.sub, req.body);
    res.status(200).json(new ApiResponse(200, user, "Profile updated"));
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await userService.changePassword(req.user.sub, req.body.currentPassword, req.body.newPassword);
    res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
  }),
};
