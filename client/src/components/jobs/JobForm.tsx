import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobLocationPicker } from "./JobLocationPicker";
import { api } from "@/lib/api";
import { toast } from "sonner";

const CATEGORIES = [
  "ELECTRICAL", "PLUMBING", "CARPENTRY", "PAINTING", "HVAC",
  "LANDSCAPING", "CLEANING", "GENERAL_HANDYMAN", "ROOFING",
  "TILING", "APPLIANCE_REPAIR", "PEST_CONTROL",
] as const;

const URGENCY = ["FLEXIBLE", "SOON", "URGENT", "EMERGENCY"] as const;

interface InitialJob {
  id: string; title: string; description: string; category: string;
  urgency: string; budgetMin: number; budgetMax: number;
  preferredDate: string | null; latitude: number; longitude: number; locationLabel: string;
}

export function JobForm({ job }: { job?: InitialJob }) {
  const isEdit = !!job;
  const navigate = useNavigate();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: job?.title ?? "",
    description: job?.description ?? "",
    category: job?.category ?? "",
    urgency: job?.urgency ?? "FLEXIBLE",
    budgetMin: job?.budgetMin?.toString() ?? "",
    budgetMax: job?.budgetMax?.toString() ?? "",
    preferredDate: job?.preferredDate
      ? new Date(job.preferredDate).toISOString().slice(0, 16)
      : "",
    latitude: (job?.latitude ?? null) as number | null,
    longitude: (job?.longitude ?? null) as number | null,
    locationLabel: job?.locationLabel ?? "",
  });

  function setField(key: string, value: string | number | null) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.error("Please select a job location on the map");
      return;
    }
    if (!form.category) {
      toast.error("Please select a skill category");
      return;
    }
    const budgetMin = parseFloat(form.budgetMin);
    const budgetMax = parseFloat(form.budgetMax);
    if (isNaN(budgetMin) || isNaN(budgetMax) || budgetMin > budgetMax) {
      toast.error("Please enter a valid budget range");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          title: form.title, description: form.description, category: form.category,
          urgency: form.urgency, budgetMin, budgetMax,
          latitude: form.latitude, longitude: form.longitude, locationLabel: form.locationLabel,
          preferredDate: form.preferredDate || undefined,
        };
        const res = isEdit
          ? await api.put(`/api/jobs/${job.id}`, payload)
          : await api.post("/api/jobs", payload);

        toast.success(isEdit ? "Job updated!" : "Job posted! Workers are being notified.");
        navigate(`/client/jobs/${res.data.job._id ?? res.data.job.id}`);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast.error(msg ?? (isEdit ? "Failed to update job" : "Failed to post job"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title *</Label>
        <Input id="title" value={form.title} onChange={(e) => setField("title", e.target.value)}
          placeholder="e.g. Fix leaking kitchen sink" required minLength={5} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Describe what needs to be done…" rows={4} required minLength={20} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Skill Category *</Label>
          <Select value={form.category} onValueChange={(v) => setField("category", v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Urgency</Label>
          <Select value={form.urgency} onValueChange={(v) => setField("urgency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {URGENCY.map((u) => (
                <SelectItem key={u} value={u}>{u.charAt(0) + u.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budgetMin">Min Budget ($) *</Label>
          <Input id="budgetMin" type="number" min={0} value={form.budgetMin}
            onChange={(e) => setField("budgetMin", e.target.value)} placeholder="50" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetMax">Max Budget ($) *</Label>
          <Input id="budgetMax" type="number" min={0} value={form.budgetMax}
            onChange={(e) => setField("budgetMax", e.target.value)} placeholder="200" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredDate">Preferred Date (optional)</Label>
        <Input id="preferredDate" type="datetime-local" value={form.preferredDate}
          onChange={(e) => setField("preferredDate", e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Job Location *</Label>
        <p className="text-xs text-slate-500">Search for an address or click on the map to pin the location.</p>
        <JobLocationPicker
          latitude={form.latitude} longitude={form.longitude} locationLabel={form.locationLabel}
          onLocationChange={(lat, lng, label) => setForm((f) => ({ ...f, latitude: lat, longitude: lng, locationLabel: label }))}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={pending}>Cancel</Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 flex-1" disabled={pending}>
          {pending ? (isEdit ? "Saving…" : "Posting job…") : (isEdit ? "Save Changes" : "Post Job")}
        </Button>
      </div>
    </form>
  );
}
