import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermission } from "../../common/middlewares/rbac.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { publicFormRateLimiter } from "../../common/middlewares/rateLimiter.middleware";
import { auditLog } from "../../common/middlewares/auditLogger.middleware";
import { newsletterController } from "./newsletter.controller";
import { subscribeSchema } from "./newsletter.validation";

const router = Router();

router.post("/subscribe", publicFormRateLimiter, validateBody(subscribeSchema), newsletterController.subscribe);
router.get("/unsubscribe/:token", newsletterController.unsubscribe);

router.get("/", authenticate, checkPermission("newsletter", "read"), newsletterController.getAll);
router.delete(
  "/:id",
  authenticate,
  checkPermission("newsletter", "delete"),
  auditLog("newsletter", "delete"),
  newsletterController.remove
);

export default router;
