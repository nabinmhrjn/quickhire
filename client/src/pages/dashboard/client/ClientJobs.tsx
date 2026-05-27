import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { buttonVariants, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, DollarSign, Users, Eye, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteJobButton } from "@/components/jobs/DeleteJobButton";
import type { Job } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  IN_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ASSIGNED: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  EXPIRED: "bg-muted text-muted-foreground/70",
};

const URGENCY_LABELS: Record<string, string> = {
  FLEXIBLE: "Flexible",
  SOON: "Soon",
  URGENT: "Urgent",
  EMERGENCY: "Emergency",
};

export default function ClientJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(() => {
    if (!user) return;
    setLoading(true);
    api
      .get(`/api/jobs?clientId=${user.id}`)
      .then((r) => setJobs(r.data.jobs ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
        <Link to="/client/jobs/new" className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-700 gap-2")}>
          <Plus className="h-4 w-4" />Post a Job
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No jobs posted yet.</p>
            <Link to="/client/jobs/new" className="text-emerald-600 text-sm hover:underline mt-2 block">
              Post your first job →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const canEdit = ["OPEN", "IN_REVIEW"].includes(job.status);
            const canDelete = ["OPEN", "IN_REVIEW"].includes(job.status);
            return (
              <Card key={job._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                          {job.status.replace("_", " ")}
                        </span>
                        {job.urgency !== "FLEXIBLE" && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            {URGENCY_LABELS[job.urgency]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{job.locationLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />${job.budgetMin}–${job.budgetMax}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{job.applicationCount ?? 0} applicant{(job.applicationCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {job.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/client/jobs/${job._id}`)}>
                      <Eye className="h-3.5 w-3.5" />View
                    </Button>
                    {canEdit && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/client/jobs/${job._id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5" />Edit
                      </Button>
                    )}
                    {canDelete && <DeleteJobButton jobId={job._id} onDeleted={fetchJobs} />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
