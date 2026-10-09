import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { newsletterService } from "./newsletter.service";

export const newsletterController = {
  subscribe: asyncHandler(async (req: Request, res: Response) => {
    await newsletterService.subscribe(req.body.email);
    res.status(201).json(new ApiResponse(201, null, "Subscribed successfully"));
  }),

  unsubscribe: asyncHandler(async (req: Request, res: Response) => {
    await newsletterService.unsubscribe(req.params.token);
    res.status(200).json(new ApiResponse(200, null, "Unsubscribed successfully"));
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await newsletterService.getAll(req);
    res.status(200).json(new ApiResponse(200, result));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await newsletterService.remove(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Subscriber removed"));
  }),
};
