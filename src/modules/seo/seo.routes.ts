import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermissionFromParam } from "../../common/middlewares/rbac.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { seoController } from "./seo.controller";

const router = Router();

// AI suggestions only - nothing here writes to the database. The editor
// reviews the suggestion and saves it through the content's normal update.
router.post("/suggest", authenticate, validateBody(z.object({ title: z.string().min(1).max(300), content: z.string().max(20000).optional() })), seoController.suggest);
router.post("/generate/:resource/:id", authenticate, checkPermissionFromParam("resource", "update"), seoController.generateForRecord);

export default router;
