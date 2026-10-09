import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermission } from "../../common/middlewares/rbac.middleware";
import { auditLogController } from "./auditLog.controller";

const router = Router();

router.get("/", authenticate, checkPermission("audit-logs", "read"), auditLogController.list);

export default router;
