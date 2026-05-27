import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Application, Job, User } from "@/types";

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  SHORTLISTED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  WITHDRAWN: "bg-muted text-muted-foreground/60",
};

interface Props {
  application: Application & { workerId: User };
  jobStatus: string;
  onRefresh: () => void;
}

export function ApplicantCard({ application, jobStatus, onRefresh }: Props) {
  const worker = application.workerId as User;
  const jobId = typeof application.jobId === "object" ? (application.jobId as Job)._id : application.jobId;
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState(application.status);

  async function updateStatus(newStatus: string) {
    setLoading(newStatus);
    try {
      if (newStatus === "COMPLETED") {
        await api.put(`/api/jobs/${jobId}`, { status: "COMPLETED" });
        toast.success("Job marked as completed!");
      } else {
        await api.patch(`/api/applications/${application._id}`, { status: newStatus });
        setStatus(newStatus as typeof status);
        toast.success(newStatus === "ACCEPTED" ? "Worker hired!" : "Application updated");
      }
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Failed to update");
    } finally {
      setLoading(null);
    }
  }

  const canAct = ["OPEN", "IN_REVIEW"].includes(jobStatus) && status === "PENDING";
  const isAccepted = status === "ACCEPTED";

  return (
    <div className={`rounded-lg border p-4 ${isAccepted ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={worker.avatarUrl ?? ""} />
            <AvatarFallback>{worker.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${worker._id}`} className="font-medium text-foreground hover:underline">
                {worker.name}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full ${APP_STATUS_COLORS[status]}`}>{status}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {worker.workerRating.toFixed(1)} ({worker.workerRatingCount})
              </span>
              {worker.locationLabel && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />{worker.locationLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {worker.skills.slice(0, 3).map((s) => (
                <Badge key={s.category} variant="secondary" className="text-xs py-0">
                  {s.category.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-foreground">${application.proposedAmount}</p>
          {application.estimatedDays && (
            <p className="text-xs text-muted-foreground">{application.estimatedDays} days</p>
          )}
        </div>
      </div>


      {canAct && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1"
            onClick={() => updateStatus("ACCEPTED")} disabled={!!loading}>
            <CheckCircle className="h-3.5 w-3.5" />
            {loading === "ACCEPTED" ? "Hiring…" : "Hire"}
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
            onClick={() => updateStatus("REJECTED")} disabled={!!loading}>
            <XCircle className="h-3.5 w-3.5" />
            {loading === "REJECTED" ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      )}

      {isAccepted && jobStatus === "ASSIGNED" && (
        <Button size="sm" variant="outline" className="mt-3 text-emerald-700 border-emerald-300"
          onClick={() => updateStatus("COMPLETED")} disabled={!!loading}>
          {loading === "COMPLETED" ? "Marking…" : "Mark as Completed"}
        </Button>
      )}
    </div>
  );
}
