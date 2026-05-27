import { Bell, Briefcase, Star, CheckCircle, AlertCircle } from "lucide-react";
import type { Notification } from "@/types";

const TYPE_ICONS: Record<string, React.ElementType> = {
  NEW_APPLICATION: Briefcase,
  APPLICATION_ACCEPTED: CheckCircle,
  APPLICATION_REJECTED: AlertCircle,
  JOB_ASSIGNED: Briefcase,
  JOB_COMPLETED: CheckCircle,
  NEW_REVIEW: Star,
  NEW_JOB_NEARBY: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  NEW_APPLICATION: "bg-blue-100 text-blue-600",
  APPLICATION_ACCEPTED: "bg-emerald-100 text-emerald-600",
  APPLICATION_REJECTED: "bg-red-100 text-red-600",
  JOB_ASSIGNED: "bg-orange-100 text-orange-600",
  JOB_COMPLETED: "bg-emerald-100 text-emerald-600",
  NEW_REVIEW: "bg-amber-100 text-amber-600",
  NEW_JOB_NEARBY: "bg-muted text-muted-foreground",
};

export function NotificationItem({ notification: n }: { notification: Notification }) {
  const Icon = TYPE_ICONS[n.type] ?? Bell;
  const color = TYPE_COLORS[n.type] ?? "bg-muted text-muted-foreground";

  return (
    <div id={n._id} className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${n.isRead ? "bg-card" : "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900"}`}>
      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{n.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
      </div>
      {!n.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
    </div>
  );
}
