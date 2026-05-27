import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Review } from "@/types";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const author = typeof r.authorId === "object" ? r.authorId : null;
        const job = typeof r.jobId === "object" ? r.jobId : null;
        return (
          <div key={r._id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={author?.avatarUrl ?? ""} />
                  <AvatarFallback className="text-xs">{author?.name?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{author?.name ?? "Anonymous"}</p>
                  {job && <p className="text-xs text-muted-foreground">{job.title}</p>}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{r.comment}</p>
            <p className="text-xs text-muted-foreground/60">{new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
        );
      })}
    </div>
  );
}
