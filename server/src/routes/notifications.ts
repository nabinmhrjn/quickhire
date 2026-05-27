import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getNotifications, markRead, markAllRead, clearAll } from "../controllers/notificationController";

const router = Router();

router.get("/", authenticate, getNotifications);
router.patch("/read-all/mark", authenticate, markAllRead);
router.patch("/:id", authenticate, markRead);
router.delete("/", authenticate, clearAll);

export default router;
