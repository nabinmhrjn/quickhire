import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Plus, Users, CheckCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  IN_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ASSIGNED: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

interface JobWithCount extends Job {
  applicationCount: number;
  acceptedWorkerName?: string;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .get(`/api/jobs?clientId=${user.id}`)
      .then((res) => setJobs(res.data.jobs ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const statMap = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.status] = (acc[j.status] ?? 0) + 1;
    return acc;
  }, {});

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your posted jobs</p>
        </div>
        <Link to="/client/jobs/new" className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-700 gap-2")}>
          <Plus className="h-4 w-4" />Post a Job
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: statMap.OPEN ?? 0, icon: Briefcase, color: "text-emerald-600" },
          { label: "In Review", value: statMap.IN_REVIEW ?? 0, icon: Users, color: "text-blue-600" },
          { label: "Active", value: statMap.ASSIGNED ?? 0, icon: Clock, color: "text-orange-600" },
          { label: "Completed", value: statMap.COMPLETED ?? 0, icon: CheckCircle, color: "text-muted-foreground" },
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Jobs</CardTitle>
          <Link to="/client/jobs" className="text-sm text-emerald-600 hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No jobs posted yet.</p>
              <Link to="/client/jobs/new" className="text-emerald-600 text-sm hover:underline mt-1 block">
                Post your first job →
              </Link>
            </div>
          ) : (
            recentJobs.map((job) => (
              <Link
                key={job._id}
                to={`/client/jobs/${job._id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {job.applicationCount ?? 0} applicant{(job.applicationCount ?? 0) !== 1 ? "s" : ""}
                    {job.acceptedWorkerName && ` · Hired: ${job.acceptedWorkerName}`}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[job.status]}`}>
                  {job.status.replace("_", " ")}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
