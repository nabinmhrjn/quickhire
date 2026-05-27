import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function DeleteJobButton({ jobId, onDeleted }: { jobId: string; onDeleted?: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await api.delete(`/api/jobs/${jobId}`);
        toast.success("Job deleted successfully");
        setOpen(false);
        if (onDeleted) onDeleted();
        else navigate("/client/jobs");
      } catch {
        toast.error("Failed to delete job");
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm"
        className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5"
        onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" />Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this job?</DialogTitle>
            <DialogDescription>
              This will cancel the job posting and notify any applicants. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Keep Job</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? "Cancelling…" : "Yes, Cancel Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
