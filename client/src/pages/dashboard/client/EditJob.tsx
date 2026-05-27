import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobForm } from "@/components/jobs/JobForm";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Job } from "@/types";

export default function EditJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    api
      .get(`/api/jobs/${jobId}`)
      .then((r) => {
        const j: Job = r.data.job;
        if (!["OPEN", "IN_REVIEW"].includes(j.status)) {
          navigate(`/client/jobs/${jobId}`);
          return;
        }
        setJob(j);
      })
      .catch(() => navigate("/client/jobs"))
      .finally(() => setLoading(false));
  }, [jobId, navigate]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  if (!job) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link to={`/client/jobs/${jobId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to job
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Edit Job</CardTitle>
          <p className="text-sm text-muted-foreground">Update the details of your posted job.</p>
        </CardHeader>
        <CardContent>
          <JobForm
            job={{
              id: job._id,
              title: job.title,
              description: job.description,
              category: job.category,
              urgency: job.urgency,
              budgetMin: job.budgetMin,
              budgetMax: job.budgetMax,
              preferredDate: job.preferredDate ?? null,
              latitude: job.latitude,
              longitude: job.longitude,
              locationLabel: job.locationLabel,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
