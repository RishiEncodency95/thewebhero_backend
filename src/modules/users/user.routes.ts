import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermission } from "../../common/middlewares/rbac.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { auditLog } from "../../common/middlewares/auditLogger.middleware";
import { userController } from "./user.controller";
import {
  changePasswordSchema,
  createUserSchema,
  updateMeSchema,
  updateUserSchema,
} from "./user.validation";

const router = Router();

router.use(authenticate);

// Self-service routes (any authenticated user)
router.get("/me", userController.me);
router.put("/me", validateBody(updateMeSchema), userController.updateMe);
router.put("/me/change-password", validateBody(changePasswordSchema), userController.changePassword);

// Admin user-management routes
router.get("/", checkPermission("users", "read"), userController.getAll);
router.get("/:id", checkPermission("users", "read"), userController.getById);

router.post(
  "/",
  checkPermission("users", "create"),
  validateBody(createUserSchema),
  auditLog("users", "create"),
  userController.create
);

router.put(
  "/:id",
  checkPermission("users", "update"),
  validateBody(updateUserSchema),
  auditLog("users", "update"),
  userController.update
);

router.delete(
  "/:id",
  checkPermission("users", "delete"),
  auditLog("users", "delete"),
  userController.remove
);

export default router;
