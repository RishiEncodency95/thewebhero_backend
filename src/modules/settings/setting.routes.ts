import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermission } from "../../common/middlewares/rbac.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { auditLog } from "../../common/middlewares/auditLogger.middleware";
import { settingController } from "./setting.controller";
import { updateSettingSchema } from "./setting.validation";

const router = Router();

router.get("/", settingController.get); // public - website reads site settings too

router.put(
  "/",
  authenticate,
  checkPermission("settings", "update"),
  validateBody(updateSettingSchema),
  auditLog("settings", "update"),
  settingController.update
);

export default router;
