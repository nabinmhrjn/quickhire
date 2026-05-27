import { useEffect, useRef } from "react";
import type { Job } from "@/types";

interface MapboxMarker {
  setLngLat: (c: [number, number]) => MapboxMarker;
  addTo: (m: MapboxMap) => MapboxMarker;
  getElement: () => HTMLElement;
}
interface MapboxPopup {
  setLngLat: (c: [number, number]) => MapboxPopup;
  setHTML: (html: string) => MapboxPopup;
  addTo: (m: MapboxMap) => MapboxPopup;
}
interface MapboxMap {
  on: (event: string, cb: () => void) => void;
  remove: () => void;
}
interface MapboxGL {
  accessToken: string;
  Map: new (opts: object) => MapboxMap;
  Marker: new (opts?: object) => MapboxMarker;
  Popup: new (opts?: object) => MapboxPopup;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface Props {
  jobs: Job[];
  workerLat: number;
  workerLng: number;
  onJobSelect?: (jobId: string) => void;
}

export function NearbyJobsMap({ jobs, workerLat, workerLng, onJobSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapboxMap | null>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapRef.current || mapInstance.current) return;

    import("mapbox-gl").then((mod) => {
      const mbgl = (mod.default ?? mod) as unknown as MapboxGL;
      mbgl.accessToken = MAPBOX_TOKEN;

      const map = new mbgl.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [workerLng, workerLat],
        zoom: 11,
      });
      mapInstance.current = map;

      map.on("load", () => {
        new mbgl.Marker({ color: "#2563eb" }).setLngLat([workerLng, workerLat]).addTo(map);

        const urgencyColor: Record<string, string> = {
          EMERGENCY: "#dc2626", URGENT: "#ea580c", SOON: "#d97706", FLEXIBLE: "#059669",
        };

        jobs.forEach((job) => {
          const color = urgencyColor[job.urgency] ?? "#059669";
          const marker = new mbgl.Marker({ color }).setLngLat([job.longitude, job.latitude]).addTo(map);
          marker.getElement().addEventListener("click", () => onJobSelect?.(job._id));
        });
      });

      return () => { map.remove(); mapInstance.current = null; };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapRef} className="h-full w-full rounded-lg overflow-hidden border bg-slate-100" />;
}
