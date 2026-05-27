import { useEffect, useState, useCallback, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import type { Notification } from "@/types";

export function useRealtimeNotifications(accessToken: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api.get("/api/notifications?unread=true");
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch {
      // ignore
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    fetchUnreadCount();

    const socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:5000", {
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on("notification", (notification: Notification) => {
      setUnreadCount((c) => c + 1);
      setLatestNotification(notification);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, fetchUnreadCount]);

  const markAllRead = useCallback(async () => {
    await api.patch("/api/notifications/read-all/mark");
    setUnreadCount(0);
  }, []);

  return { unreadCount, latestNotification, markAllRead, fetchUnreadCount };
}
