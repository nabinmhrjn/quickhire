import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ClipboardList, Star, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Application, Job, User } from "@/types";

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  SHORTLISTED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  WITHDRAWN: "bg-muted text-muted-foreground/60",
};

type PopulatedApplication = Application & { jobId: Job };

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PopulatedApplication[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/applications").then((r) => r.data.applications ?? []),
      api.get("/api/users/me").then((r) => r.data.user),
    ])
      .then(([apps, me]) => {
        setApplications(apps);
        setProfile(me);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: applications.length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    completed: applications.filter(
      (a) => a.status === "ACCEPTED" && (a.jobId as Job)?.status === "COMPLETED"
    ).length,
  };

  const needsLocation = !profile?.locationLabel && !profile?.latitude;
  const recentApps = applications.slice(0, 5);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Worker Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your applications and jobs</p>
        </div>
        <Link to="/worker/jobs" className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-700 gap-2")}>
          <MapPin className="h-4 w-4" />Browse Jobs
        </Link>
      </div>

      {!loading && needsLocation && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-center justify-between">
          <span>Set your location to start receiving nearby job alerts.</span>
          <Link to="/profile" className={cn(buttonVariants({ size: "sm", variant: "outline" }), "border-amber-300 text-amber-800 hover:bg-amber-100")}>
            Set Location
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Applications", value: stats.total, icon: ClipboardList, color: "text-muted-foreground" },
          { label: "Pending", value: stats.pending, icon: ClipboardList, color: "text-blue-600" },
          { label: "Active Jobs", value: stats.accepted, icon: MapPin, color: "text-orange-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {profile && profile.workerRatingCount > 0 && (
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
            <div>
              <p className="text-lg font-bold text-foreground">
                {profile.workerRating.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({profile.workerRatingCount} review{profile.workerRatingCount !== 1 ? "s" : ""})
                </span>
              </p>
              <p className="text-xs text-muted-foreground">Your worker rating</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Applications</CardTitle>
          <Link to="/worker/applications" className="text-sm text-emerald-600 hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : recentApps.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No applications yet.</p>
              <Link to="/worker/jobs" className="text-emerald-600 text-sm hover:underline block mt-1">
                Browse nearby jobs →
              </Link>
            </div>
          ) : (
            recentApps.map((app) => {
              const job = app.jobId as Job;
              return (
                <Link
                  key={app._id}
                  to={`/worker/jobs/${job?._id ?? app.jobId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{job?.title ?? "Job"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job?.category?.replace("_", " ")} · ${app.proposedAmount} quote
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${APP_STATUS_COLORS[app.status]}`}>
                    {app.status}
                  </span>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
