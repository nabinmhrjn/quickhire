import Notification from "../models/Notification";
import type { NotificationType } from "../types";
import { getIO } from "../socket";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    data: data ?? {},
  });

  getIO().to(`user:${userId}`).emit("notification", notification);

  return notification;
}

export async function createNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (userIds.length === 0) return;

  const docs = userIds.map((userId) => ({ userId, type, title, body, data: data ?? {} }));
  const notifications = await Notification.insertMany(docs, { ordered: false });

  const io = getIO();
  notifications.forEach((n) => {
    io.to(`user:${n.userId.toString()}`).emit("notification", n);
  });
}
