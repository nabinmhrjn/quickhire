import { Response } from "express";
import Notification from "../models/Notification";
import { type AuthRequest } from "../middleware/auth";

export async function getNotifications(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const limit = 20;
  const unreadOnly = req.query.unread === "true";

  const filter: Record<string, unknown> = { userId: req.user!.userId };
  if (unreadOnly) filter.isRead = false;

  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ userId: req.user!.userId, isRead: false }),
    Notification.countDocuments({ userId: req.user!.userId }),
  ]);

  res.json({ notifications, unreadCount, total });
}

export async function markRead(req: AuthRequest, res: Response) {
  const result = await Notification.updateOne(
    { _id: req.params.id, userId: req.user!.userId },
    { isRead: true }
  );

  if (result.matchedCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true });
}

export async function markAllRead(req: AuthRequest, res: Response) {
  await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
  res.json({ success: true });
}

export async function clearAll(req: AuthRequest, res: Response) {
  await Notification.deleteMany({ userId: req.user!.userId });
  res.json({ success: true });
}
