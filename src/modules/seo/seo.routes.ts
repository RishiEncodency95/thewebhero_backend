import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { checkPermissionFromParam } from "../../common/middlewares/rbac.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { seoController } from "./seo.controller";

const router = Router();

// /suggest and /generate only return suggestions the editor reviews;
// /optimize writes the result straight into the record.
router.post(
  "/suggest",
  authenticate,
  validateBody(z.object({ title: z.string().min(1).max(300), content: z.string().max(20000).optional(), slug: z.string().max(200).optional(), path: z.string().max(300).optional(), pageType: z.string().max(60).optional() })),
  seoController.suggest
);
router.post("/generate/:resource/:id", authenticate, checkPermissionFromParam("resource", "update"), seoController.generateForRecord);
// Generates AND saves SEO for one record (used by the SEO Center's "Optimize with AI").
router.post("/optimize/:resource/:id", authenticate, checkPermissionFromParam("resource", "update"), seoController.optimize);

export default router;
