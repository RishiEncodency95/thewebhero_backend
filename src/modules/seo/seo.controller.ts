import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { ApiError } from "../../common/utils/ApiError";
import { seoService } from "./seo.service";
import { SEO_SUPPORTED_RESOURCES, SeoSupportedResource } from "./seo.types";

export const seoController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const { resource, id } = req.params;

    if (!(SEO_SUPPORTED_RESOURCES as readonly string[]).includes(resource)) {
      throw ApiError.badRequest(
        `SEO generation is not supported for "${resource}". Supported: ${SEO_SUPPORTED_RESOURCES.join(", ")}`
      );
    }

    const suggestion = await seoService.generate(resource as SeoSupportedResource, id);
    res.status(200).json(new ApiResponse(200, suggestion, "SEO suggestion generated"));
  }),
};
