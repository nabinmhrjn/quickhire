import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { ClearAllNotificationsButton } from "@/components/notifications/ClearAllNotificationsButton";
import { Bell, Loader2 } from "lucide-react";
import type { Notification } from "@/types";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  function fetchNotifications() {
    api
      .get("/api/notifications")
      .then((r) => {
        setNotifications(r.data.notifications ?? []);
        setTotal(r.data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchNotifications();
    // Mark all as read after loading
    api.patch("/api/notifications/read-all/mark").catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total</p>
        </div>
        {notifications.length > 0 && (
          <ClearAllNotificationsButton onClear={() => { setNotifications([]); setTotal(0); }} />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
