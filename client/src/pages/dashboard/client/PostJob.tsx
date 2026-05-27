import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobForm } from "@/components/jobs/JobForm";
import { ArrowLeft } from "lucide-react";

export default function PostJob() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link to="/client/jobs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to jobs
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
          <p className="text-sm text-muted-foreground">
            Nearby workers matching your skill requirement will be notified automatically.
          </p>
        </CardHeader>
        <CardContent>
          <JobForm />
        </CardContent>
      </Card>
    </div>
  );
}
