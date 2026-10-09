import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { settingService } from "./setting.service";

export const settingController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    const setting = await settingService.get();
    res.status(200).json(new ApiResponse(200, setting));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const setting = await settingService.update(req.body);
    res.status(200).json(new ApiResponse(200, setting, "Settings updated"));
  }),
};
