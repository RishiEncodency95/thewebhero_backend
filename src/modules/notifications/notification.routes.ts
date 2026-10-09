import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { notificationController } from "./notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.getMine);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);

export default router;
