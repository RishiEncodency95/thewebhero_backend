import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermission } from "../../common/middlewares/rbac.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { auditLog } from "../../common/middlewares/auditLogger.middleware";
import { homePageController } from "./homePage.controller";
import { updateHomePageSchema } from "./homePage.validation";

const router = Router();

router.get("/", homePageController.get); // public - website home page consumes this

router.put(
  "/",
  authenticate,
  checkPermission("home-page", "update"),
  validateBody(updateHomePageSchema),
  auditLog("home-page", "update"),
  homePageController.update
);

export default router;
