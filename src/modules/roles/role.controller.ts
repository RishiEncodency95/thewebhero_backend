import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { roleService } from "./role.service";

export const roleController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.create(req.body);
    res.status(201).json(new ApiResponse(201, role, "Role created"));
  }),

  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const roles = await roleService.getAll();
    res.status(200).json(new ApiResponse(200, roles));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.getById(req.params.id);
    res.status(200).json(new ApiResponse(200, role));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.update(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, role, "Role updated"));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await roleService.remove(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Role deleted"));
  }),

  getPermissionMatrix: asyncHandler(async (_req: Request, res: Response) => {
    const matrix = roleService.getPermissionMatrix();
    res.status(200).json(new ApiResponse(200, matrix));
  }),
};
