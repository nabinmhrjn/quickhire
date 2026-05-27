import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function ClearAllNotificationsButton({ onClear }: { onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      try {
        await api.delete("/api/notifications");
        toast.success("All notifications cleared");
        setOpen(false);
        onClear();
      } catch {
        toast.error("Failed to clear notifications");
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
        onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" />Clear All
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all notifications?</DialogTitle>
            <DialogDescription>This will permanently delete all your notifications. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button variant="destructive" onClick={handleClear} disabled={pending}>
              {pending ? "Clearing…" : "Yes, Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
