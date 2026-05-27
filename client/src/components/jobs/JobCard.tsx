import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, DollarSign, Clock, Zap } from "lucide-react";
import type { Job } from "@/types";

const URGENCY_COLOR: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  URGENT: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  SOON: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  FLEXIBLE: "bg-muted text-muted-foreground",
};

export function JobCard({ job, href }: { job: Job; href: string }) {
  return (
    <Link to={href}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${job.isFeatured ? "border-amber-300 bg-amber-50/30" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {job.isFeatured && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Featured
                  </span>
                )}
                <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {job.distance_label && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                    {job.distance_label}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-emerald-600" />
                  ${job.budgetMin}–${job.budgetMax}
                </span>
                {job.applicationCount !== undefined && (
                  <span>{job.applicationCount} applicant{job.applicationCount !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant="outline" className="text-xs">
                {job.category.replace("_", " ")}
              </Badge>
              {job.urgency !== "FLEXIBLE" && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${URGENCY_COLOR[job.urgency]}`}>
                  <Clock className="h-3 w-3" />
                  {job.urgency}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
