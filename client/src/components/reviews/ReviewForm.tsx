import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  jobId: string;
  subjectId: string;
  subjectName: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ jobId, subjectId, subjectName, onSubmitted }: Props) {
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating"); return; }
    startTransition(async () => {
      try {
        await api.post("/api/reviews", { jobId, subjectId, rating, comment });
        toast.success("Review submitted!");
        onSubmitted?.();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast.error(msg ?? "Failed to submit review");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Rate your experience with <span className="font-medium">{subjectName}</span>
      </p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
            className="focus:outline-none">
            <Star className={`h-7 w-7 transition-colors ${
              star <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
            }`} />
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="comment">Review *</Label>
        <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience…" rows={3} required minLength={10} />
      </div>
      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={pending || rating === 0}>
        {pending ? "Submitting…" : "Submit Review"}
      </Button>
    </form>
  );
}
