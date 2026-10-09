import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermissionFromParam } from "../../common/middlewares/rbac.middleware";
import { seoController } from "./seo.controller";

const router = Router();

// Manual trigger only - the admin clicks "Generate SEO" on a content item,
// reviews the AI suggestion, then saves it via that module's normal PUT
// endpoint (e.g. PUT /blog/:id with { seo: {...} }). Nothing here writes to DB.
router.post(
  "/generate/:resource/:id",
  authenticate,
  checkPermissionFromParam("resource", "update"),
  seoController.generate
);

export default router;
