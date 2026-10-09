import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ACTIONS, Action, DEFAULT_ROLES, RESOURCES, Resource } from "../../config/constants";

// Permissions are embedded in the JWT at login time (see auth.service.ts),
// so this check is a pure in-memory lookup - no DB hit per request.
export const checkPermission = (resource: Resource, action: Action) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized("Authentication required");

    if (req.user.role === DEFAULT_ROLES.SUPER_ADMIN) return next();

    const key = `${resource}:${action}`;
    if (!req.user.permissions?.includes(key)) {
      throw ApiError.forbidden(`You don't have permission to ${action} ${resource}`);
    }

    next();
  };
};

// Same as checkPermission(), but the resource comes from a route param
// (e.g. POST /seo/generate/:resource/:id) instead of being fixed at route-definition time.
export const checkPermissionFromParam = (paramName: string, action: Action) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized("Authentication required");

    const resource = req.params[paramName];
    if (!(RESOURCES as readonly string[]).includes(resource)) {
      throw ApiError.badRequest(`Unknown resource: ${resource}`);
    }
    if (!(ACTIONS as readonly string[]).includes(action)) {
      throw ApiError.badRequest(`Unknown action: ${action}`);
    }

    if (req.user.role === DEFAULT_ROLES.SUPER_ADMIN) return next();

    const key = `${resource}:${action}`;
    if (!req.user.permissions?.includes(key)) {
      throw ApiError.forbidden(`You don't have permission to ${action} ${resource}`);
    }

    next();
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized("Authentication required");
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden("You don't have access to this resource");
    }
    next();
  };
};
