import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { homePageService } from "./homePage.service";

export const homePageController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    const page = await homePageService.get();
    res.status(200).json(new ApiResponse(200, page));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const page = await homePageService.update(req.body);
    res.status(200).json(new ApiResponse(200, page, "Home page updated"));
  }),
};
