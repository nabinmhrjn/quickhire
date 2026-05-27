import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicantCard } from "@/components/jobs/ApplicantCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { MapPin, DollarSign, Calendar, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Job, Application, User } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  IN_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ASSIGNED: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

type PopulatedClient = { _id: string; name: string; avatarUrl?: string; clientRating: number; clientRatingCount: number; locationLabel?: string };
type PopulatedApplication = Application & { workerId: User };

export default function ClientJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<PopulatedApplication[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = useCallback(() => {
    if (!jobId) return;
    Promise.all([
      api.get(`/api/jobs/${jobId}`).then((r) => r.data.job),
      api.get(`/api/applications/job/${jobId}`).then((r) => r.data.applications ?? []).catch(() => []),
    ])
      .then(([j, apps]) => {
        if (j.clientId?._id && j.clientId._id !== user?.id) {
          navigate("/client/jobs");
          return;
        }
        setJob(j);
        setApplications(apps);
      })
      .catch(() => navigate("/client/jobs"))
      .finally(() => setLoading(false));
  }, [jobId, user, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCancel() {
    if (!jobId) return;
    setCancelling(true);
    try {
      await api.put(`/api/jobs/${jobId}`, { status: "CANCELLED" });
      toast.success("Job cancelled");
      fetchData();
    } catch {
      toast.error("Failed to cancel job");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  if (!job) return null;

  const client = typeof job.clientId === "object" ? job.clientId as PopulatedClient : null;
  const acceptedApp = applications.find((a) => a.status === "ACCEPTED");
  const canCancel = job.status === "OPEN" || job.status === "IN_REVIEW";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link to="/client/jobs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to jobs
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
            <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[job.status]}`}>
              {job.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{job.category.replace("_", " ")}</p>
        </div>
        {canCancel && (
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling…" : "Cancel Job"}
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent className="text-sm text-foreground whitespace-pre-line">{job.description}</CardContent>
          </Card>

          {job.status === "COMPLETED" && !reviewed && acceptedApp && (
            <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
              <CardHeader><CardTitle className="text-base text-emerald-800 dark:text-emerald-300">Leave a Review</CardTitle></CardHeader>
              <CardContent>
                <ReviewForm
                  jobId={job._id}
                  subjectId={(acceptedApp.workerId as User)._id}
                  subjectName={(acceptedApp.workerId as User).name}
                  onSubmitted={() => setReviewed(true)}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Applicants ({applications.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              ) : (
                applications.map((app) => (
                  <ApplicantCard key={app._id} application={app} jobStatus={job.status} onRefresh={fetchData} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>${job.budgetMin} – ${job.budgetMax}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{job.locationLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>{job.urgency.replace("_", " ")}</span>
              </div>
              {job.preferredDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span>{new Date(job.preferredDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {acceptedApp && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Hired Worker</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={(acceptedApp.workerId as User).avatarUrl ?? ""} />
                  <AvatarFallback>{(acceptedApp.workerId as User).name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <Link to={`/profile/${(acceptedApp.workerId as User)._id}`} className="text-sm font-medium hover:underline">
                    {(acceptedApp.workerId as User).name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    ★ {(acceptedApp.workerId as User).workerRating.toFixed(1)} · ${acceptedApp.proposedAmount}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
