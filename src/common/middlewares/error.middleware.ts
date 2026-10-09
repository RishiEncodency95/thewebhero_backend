import { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { logger } from "../../config/logger";
import { isProd } from "../../config/env";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = err.flatten().fieldErrors;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if ((err as MongoServerError)?.code === 11000) {
    statusCode = 409;
    const keyValue = (err as MongoServerError).keyValue;
    message = `Duplicate value for field: ${Object.keys(keyValue ?? {}).join(", ")}`;
  } else if (err instanceof Error) {
    message = isProd ? message : err.message;
  } else if (!isProd && err && typeof err === "object" && "message" in err) {
    // Some SDKs (e.g. Cloudinary) reject with plain error-shaped objects
    // rather than real Error instances - surface their message in dev only.
    message = String((err as { message: unknown }).message);
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.originalUrl }, "Unhandled error");
  } else {
    logger.warn({ message, path: req.originalUrl }, "Request error");
  }

  res
    .status(statusCode)
    .json(
      new ApiResponse(statusCode, isProd && statusCode >= 500 ? undefined : details, message)
    );
};
