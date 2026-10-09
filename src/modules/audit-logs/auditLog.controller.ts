import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { auditLogService } from "./auditLog.service";

export const auditLogController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await auditLogService.list(req);
    res.status(200).json(new ApiResponse(200, result));
  }),
};
