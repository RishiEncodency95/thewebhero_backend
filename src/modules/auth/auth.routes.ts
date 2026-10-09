import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authRateLimiter } from "../../common/middlewares/rateLimiter.middleware";
import { validateBody } from "../../common/middlewares/validate.middleware";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "./auth.validation";

const router = Router();

router.post("/login", authRateLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);

router.post(
  "/forgot-password",
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authRateLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

export default router;
