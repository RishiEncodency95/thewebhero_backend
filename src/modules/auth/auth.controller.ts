import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { ApiResponse } from "../../common/utils/ApiResponse";
import { ApiError } from "../../common/utils/ApiError";
import { authService } from "./auth.service";
import { auditLogService } from "../audit-logs/auditLog.service";
import { env } from "../../config/env";
import { COOKIE_NAMES } from "../../config/constants";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_COOKIE_OPTIONS);

    await auditLogService.record({
      req,
      action: "login",
      resource: "auth",
      resourceId: user.id,
      userId: user.id,
      userEmail: user.email,
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: (user.role as unknown as { name: string; permissions: string[] }).name,
            permissions: (user.role as unknown as { name: string; permissions: string[] }).permissions,
          },
        },
        "Login successful"
      )
    );
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    const { accessToken, refreshToken } = await authService.refresh(token);

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json(new ApiResponse(200, { accessToken }));
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (req.user) await authService.logout(req.user.sub);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: "/api/v1/auth" });
    res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res
      .status(200)
      .json(new ApiResponse(200, null, "If that email exists, a reset link has been sent"));
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    res.status(200).json(new ApiResponse(200, req.user));
  }),
};
