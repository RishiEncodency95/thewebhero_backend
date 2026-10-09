import { NextFunction, Request, Response } from "express";
import { auditLogService } from "../../modules/audit-logs/auditLog.service";

type MutationAction = "create" | "update" | "delete";

// Attach after the route handler responds successfully to log the mutation.
// Usage: router.post("/", authenticate, checkPermission(...), validate(...), auditLog("blog", "create"), controller.create)
// Placed BEFORE the controller in the chain; it wraps res.json to capture the created/updated id.
export const auditLog = (resource: string, action: MutationAction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
      if (res.statusCode < 400) {
        const resourceId =
          (body as { data?: { _id?: string; id?: string } })?.data?._id ??
          (body as { data?: { _id?: string; id?: string } })?.data?.id ??
          req.params.id;

        void auditLogService.record({ req, action, resource, resourceId });
      }
      return originalJson(body);
    };

    next();
  };
};
