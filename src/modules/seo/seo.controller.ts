import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { seoService } from "./seo.service";

export const seoController = {
  generateForRecord: asyncHandler(async (req: Request, res: Response) => {
    const suggestion = await seoService.generateForRecord(req.params.resource, req.params.id);
    res.status(200).json(new ApiResponse(200, suggestion, "SEO suggestion generated"));
  }),

  suggest: asyncHandler(async (req: Request, res: Response) => {
    const suggestion = await seoService.suggest(req.body);
    res.status(200).json(new ApiResponse(200, suggestion, "SEO suggestion generated"));
  }),

  optimize: asyncHandler(async (req: Request, res: Response) => {
    const result = await seoService.optimizeRecord(req.params.resource, req.params.id, { force: req.query.force === "true" });
    res.status(200).json(new ApiResponse(200, result, result.changed ? "SEO optimized" : "SEO already complete"));
  }),
};
