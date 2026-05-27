import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobCard } from "@/components/jobs/JobCard";
import { NearbyJobsMap } from "@/components/jobs/NearbyJobsMap";
import { useGeolocation } from "@/hooks/useGeolocation";
import { List, Map, LocateFixed, Loader2 } from "lucide-react";
import type { Job } from "@/types";

const CATEGORIES = [
  "ALL", "ELECTRICAL", "PLUMBING", "CARPENTRY", "PAINTING", "HVAC",
  "LANDSCAPING", "CLEANING", "GENERAL_HANDYMAN", "ROOFING",
  "TILING", "APPLIANCE_REPAIR", "PEST_CONTROL",
];

const RADIUS_OPTIONS = [
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "25 km", value: 25000 },
  { label: "50 km", value: 50000 },
];

export default function BrowseJobs() {
  const navigate = useNavigate();
  const { latitude: gpsLat, longitude: gpsLng, loading: geoLoading, getLocation } = useGeolocation();
  const [savedLocation, setSavedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [category, setCategory] = useState("ALL");
  const [radius, setRadius] = useState(25000);
  const [total, setTotal] = useState(0);

  const activeLat = gpsLat ?? savedLocation?.lat ?? null;
  const activeLng = gpsLng ?? savedLocation?.lng ?? null;

  const fetchJobs = useCallback(
    async (lat: number, lng: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          radius: String(radius),
          status: "OPEN",
        });
        if (category !== "ALL") params.set("category", category);
        const res = await api.get(`/api/jobs?${params}`);
        setJobs(res.data.jobs ?? []);
        setTotal(res.data.total ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [radius, category]
  );

  useEffect(() => { getLocation(); }, [getLocation]);

  useEffect(() => {
    api
      .get("/api/users/me")
      .then((r) => {
        const u = r.data.user;
        if (u?.latitude && u?.longitude) {
          setSavedLocation({ lat: u.latitude, lng: u.longitude });
        }
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  useEffect(() => {
    if (activeLat && activeLng) {
      fetchJobs(activeLat, activeLng);
    }
  }, [activeLat, activeLng, fetchJobs]);

  const locationKnown = activeLat !== null && activeLng !== null;
  const locationPending = initializing || (geoLoading && !locationKnown);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browse Jobs</h1>
          {locationKnown && jobs.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{total} jobs near you</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={getLocation} disabled={geoLoading} className="gap-1">
            {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            {gpsLat ? "Refresh location" : "Use my location"}
          </Button>
          <div className="flex rounded-lg border overflow-hidden">
            <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="rounded-none h-8" onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={view === "map" ? "default" : "ghost"} size="sm" className="rounded-none h-8" onClick={() => setView("map")}>
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "ALL" ? "All categories" : c.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(radius)} onValueChange={(v) => v && setRadius(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Radius" />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(locationPending || (locationKnown && loading)) && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {!locationKnown && !locationPending && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
          <LocateFixed className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-foreground">Enable location to see nearby jobs</p>
          <p className="text-sm text-muted-foreground mt-1">We need your location to show jobs near you.</p>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={getLocation}>
            Share my location
          </Button>
        </div>
      )}

      {locationKnown && !loading && jobs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No jobs found within {radius / 1000} km.</p>
          <p className="text-sm mt-1">Try expanding the radius or changing the category.</p>
        </div>
      )}

      {locationKnown && !loading && jobs.length > 0 && view === "list" && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} href={`/worker/jobs/${job._id}`} />
          ))}
        </div>
      )}

      {locationKnown && !loading && jobs.length > 0 && view === "map" && activeLat && activeLng && (
        <div className="h-[60vh]">
          <NearbyJobsMap
            jobs={jobs}
            workerLat={activeLat}
            workerLng={activeLng}
            onJobSelect={(id) => navigate(`/worker/jobs/${id}`)}
          />
        </div>
      )}
    </div>
  );
}
