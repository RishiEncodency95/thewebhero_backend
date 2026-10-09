import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermission } from "../../common/middlewares/rbac.middleware";
import { upload } from "../../common/middlewares/upload.middleware";
import { auditLog } from "../../common/middlewares/auditLogger.middleware";
import { mediaController } from "./media.controller";

const router = Router();

router.use(authenticate);

router.get("/", checkPermission("media", "read"), mediaController.getAll);

router.post(
  "/",
  checkPermission("media", "create"),
  upload.single("file"),
  auditLog("media", "create"),
  mediaController.upload
);

router.put(
  "/:id",
  checkPermission("media", "update"),
  upload.single("file"),
  auditLog("media", "update"),
  mediaController.replace
);

router.delete("/:id", checkPermission("media", "delete"), auditLog("media", "delete"), mediaController.remove);

export default router;
