import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";
import { ApiError } from "../utils/ApiError";

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

export const validateBody = (schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw ApiError.badRequest("Validation failed", result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw ApiError.badRequest("Invalid query params", result.error.flatten().fieldErrors);
    }
    req.query = result.data as never;
    next();
  };
};
