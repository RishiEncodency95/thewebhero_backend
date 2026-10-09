import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermission } from "../../common/middlewares/rbac.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { auditLog } from "../../common/middlewares/auditLogger.middleware";
import { roleController } from "./role.controller";
import { createRoleSchema, updateRoleSchema } from "./role.validation";

const router = Router();

router.use(authenticate);

router.get("/permission-matrix", checkPermission("roles", "read"), roleController.getPermissionMatrix);
router.get("/", checkPermission("roles", "read"), roleController.getAll);
router.get("/:id", checkPermission("roles", "read"), roleController.getById);

router.post(
  "/",
  checkPermission("roles", "create"),
  validateBody(createRoleSchema),
  auditLog("roles", "create"),
  roleController.create
);

router.put(
  "/:id",
  checkPermission("roles", "update"),
  validateBody(updateRoleSchema),
  auditLog("roles", "update"),
  roleController.update
);

router.delete(
  "/:id",
  checkPermission("roles", "delete"),
  auditLog("roles", "delete"),
  roleController.remove
);

export default router;
