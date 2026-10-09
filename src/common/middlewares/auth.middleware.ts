import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/tokens";

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Access token missing");
  }

  const token = header.split(" ")[1];

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw ApiError.unauthorized("Access token invalid or expired");
  }
};

// Does not throw if there's no token - useful for public GET routes that
// behave slightly differently for logged-in users (e.g. draft preview).
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = verifyAccessToken(header.split(" ")[1]);
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
};
