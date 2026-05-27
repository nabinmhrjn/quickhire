import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function ApplicationForm({ jobId, onSubmitted }: { jobId: string; onSubmitted?: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ proposedAmount: "", estimatedDays: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.proposedAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid quote amount");
      return;
    }
    startTransition(async () => {
      try {
        await api.post(`/api/applications/${jobId}`, {
          proposedAmount: amount,
          estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays) : undefined,
        });
        toast.success("Application submitted!");
        onSubmitted?.();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast.error(msg ?? "Failed to submit application");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Your Quote ($) *</Label>
        <Input id="amount" type="number" min={0} value={form.proposedAmount}
          onChange={(e) => setForm((f) => ({ ...f, proposedAmount: e.target.value }))}
          placeholder="150" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="days">Estimated Days to Complete</Label>
        <Input id="days" type="number" min={1} value={form.estimatedDays}
          onChange={(e) => setForm((f) => ({ ...f, estimatedDays: e.target.value }))}
          placeholder="2" />
      </div>
      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
        {pending ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}
