import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { MapPin, DollarSign, Clock, Calendar, ArrowLeft, Star, Loader2 } from "lucide-react";
import type { Job, Application } from "@/types";

const URGENCY_LABELS: Record<string, string> = {
  FLEXIBLE: "Flexible timing",
  SOON: "Needed soon (48h)",
  URGENT: "Urgent (24h)",
  EMERGENCY: "Emergency — ASAP",
};

type PopulatedClient = {
  _id: string; name: string; avatarUrl?: string;
  clientRating: number; clientRatingCount: number; locationLabel?: string;
};

export default function WorkerJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [existingApp, setExistingApp] = useState<Application | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      api.get(`/api/jobs/${jobId}`).then((r) => r.data.job),
      api.get("/api/applications").then((r) =>
        (r.data.applications as Application[]).find((a) => {
          const aJobId = typeof a.jobId === "object" ? (a.jobId as Job)._id : a.jobId;
          return aJobId === jobId;
        }) ?? null
      ),
    ])
      .then(([j, app]) => {
        setJob(j);
        setExistingApp(app);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  if (!job) return null;

  const client = typeof job.clientId === "object" ? job.clientId as PopulatedClient : null;
  const clientId = typeof job.clientId === "object" ? (job.clientId as PopulatedClient)._id : String(job.clientId);

  const isOwn = clientId === user?.id;
  const canApply =
    !existingApp && !applied && !isOwn && (job.status === "OPEN" || job.status === "IN_REVIEW");

  const isHiredWorker = existingApp?.status === "ACCEPTED" && job.status === "COMPLETED";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link to="/worker/jobs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to browse
      </Link>

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
            <Badge variant="outline">{job.category.replace("_", " ")}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{job.locationLabel}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Job Details</CardTitle></CardHeader>
            <CardContent className="text-sm text-foreground whitespace-pre-line">{job.description}</CardContent>
          </Card>

          {canApply && (
            <Card>
              <CardHeader><CardTitle className="text-base">Submit Your Application</CardTitle></CardHeader>
              <CardContent>
                <ApplicationForm jobId={job._id} onSubmitted={() => setApplied(true)} />
              </CardContent>
            </Card>
          )}

          {(existingApp || applied) && !isHiredWorker && (
            <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  You applied to this job.
                </p>
                {existingApp && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    Status: <span className="font-semibold">{existingApp.status}</span> ·
                    Quote: ${existingApp.proposedAmount}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {isHiredWorker && !reviewed && (
            <Card>
              <CardHeader><CardTitle className="text-base">Leave a Review</CardTitle></CardHeader>
              <CardContent>
                <ReviewForm
                  jobId={job._id}
                  subjectId={clientId}
                  subjectName={client?.name ?? "Client"}
                  onSubmitted={() => setReviewed(true)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">${job.budgetMin} – ${job.budgetMax}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{job.locationLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>{URGENCY_LABELS[job.urgency]}</span>
              </div>
              {job.preferredDate && (
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span>{new Date(job.preferredDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {client && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Posted by</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={client.avatarUrl ?? ""} />
                  <AvatarFallback>{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <Link to={`/profile/${client._id}`} className="text-sm font-medium hover:underline">
                    {client.name}
                  </Link>
                  {client.clientRatingCount > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {client.clientRating.toFixed(1)} ({client.clientRatingCount})
                    </p>
                  )}
                  {client.locationLabel && (
                    <p className="text-xs text-muted-foreground/70">{client.locationLabel}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
