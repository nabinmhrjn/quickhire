import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MapPin, ClipboardList, Loader2 } from "lucide-react";
import type { Application, Job } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  SHORTLISTED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  WITHDRAWN: "bg-muted text-muted-foreground/60",
};

const JOB_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_REVIEW: "In Review",
  ASSIGNED: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

type PopulatedApplication = Application & { jobId: Job };

export default function MyApplications() {
  const [applications, setApplications] = useState<PopulatedApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/applications")
      .then((r) => {
        setApplications(r.data.applications ?? []);
        setTotal(r.data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} total</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No applications yet.</p>
            <Link to="/worker/jobs" className="text-emerald-600 text-sm hover:underline mt-2 block">
              Browse nearby jobs →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const job = app.jobId as Job;
            return (
              <Link key={app._id} to={`/worker/jobs/${job?._id ?? ""}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{job?.title ?? "Job"}</h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status]}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Job: {JOB_STATUS_LABELS[job?.status ?? "OPEN"]}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />Your quote: ${app.proposedAmount}
                          </span>
                          {job?.locationLabel && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{job.locationLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      {job?.category && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {job.category.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
