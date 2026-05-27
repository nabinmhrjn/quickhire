import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Notification } from "@/types";

export function NotificationBell() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, latestNotification, markAllRead, fetchUnreadCount } =
    useRealtimeNotifications(accessToken);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchRecent = useCallback(() => {
    api.get("/api/notifications?page=1")
      .then((r) => setRecent(r.data.notifications?.slice(0, 5) ?? []));
  }, []);

  useEffect(() => { fetchRecent(); }, [unreadCount, fetchRecent]);

  useEffect(() => {
    if (latestNotification) {
      toast(latestNotification.title, { description: latestNotification.body });
    }
  }, [latestNotification]);

  const handleNotificationClick = useCallback(async (n: Notification) => {
    setOpen(false);
    if (!n.isRead) {
      await api.patch(`/api/notifications/${n._id}`);
      setRecent((prev) => prev.map((item) => item._id === n._id ? { ...item, isRead: true } : item));
      fetchUnreadCount();
    }
    navigate(`/notifications#${n._id}`);
  }, [navigate, fetchUnreadCount]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border-transparent hover:bg-muted transition-colors focus-visible:outline-none">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-emerald-600 hover:underline font-normal">
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <DropdownMenuGroup>
            {recent.map((n) => (
              <DropdownMenuItem
                key={n._id}
                className="flex flex-col items-start gap-0.5 py-3 cursor-pointer"
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex items-center gap-2 w-full">
                  {!n.isRead && <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
                  <span className="font-medium text-sm truncate">{n.title}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-4 line-clamp-2">{n.body}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-center text-sm text-emerald-600 cursor-pointer justify-center"
            onClick={() => { setOpen(false); navigate("/notifications"); }}
          >
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
