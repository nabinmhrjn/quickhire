import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, LocateFixed } from "lucide-react";

interface LocationResult { place_name: string; center: [number, number] }
interface Props {
  latitude: number | null; longitude: number | null; locationLabel: string;
  onLocationChange: (lat: number, lng: number, label: string) => void;
}
interface MapboxMarker {
  setLngLat: (c: [number, number]) => MapboxMarker;
  addTo: (m: MapboxMap) => MapboxMarker;
  remove: () => void;
}
interface MapboxMap {
  on: (event: string, cb: (e?: unknown) => void) => void;
  flyTo: (opts: object) => void;
  remove: () => void;
}
interface MapboxGL {
  accessToken: string;
  Map: new (opts: object) => MapboxMap;
  Marker: new (opts?: object) => MapboxMarker;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export function JobLocationPicker({ latitude, longitude, locationLabel, onLocationChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const [query, setQuery] = useState(locationLabel);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapRef.current || mapInstance.current) return;

    import("mapbox-gl").then((mod) => {
      const mbgl = (mod.default ?? mod) as unknown as MapboxGL;
      mbgl.accessToken = MAPBOX_TOKEN;

      const map = new mbgl.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: longitude && latitude ? [longitude, latitude] : [-74.006, 40.7128],
        zoom: latitude ? 13 : 10,
      });

      map.on("load", () => setMapLoaded(true));

      map.on("click", async (e) => {
        const event = e as { lngLat: { lat: number; lng: number } };
        const { lat, lng } = event.lngLat;

        markerRef.current?.remove();
        markerRef.current = new mbgl.Marker({ color: "#059669" }).setLngLat([lng, lat]).addTo(map);

        const label = await reverseGeocode(lat, lng);
        setQuery(label);
        onLocationChange(lat, lng, label);
      });

      mapInstance.current = map;

      if (latitude && longitude) {
        markerRef.current = new mbgl.Marker({ color: "#059669" }).setLngLat([longitude, latitude]).addTo(map);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    if (!query.trim() || !MAPBOX_TOKEN) return;
    setSearching(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.features ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features?.[0]?.place_name) return data.features[0].place_name;
    // fall back to broader types if no street address found
    const url2 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    const res2 = await fetch(url2);
    const data2 = await res2.json();
    return data2.features?.[0]?.place_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  function handleCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const label = await reverseGeocode(lat, lng);
          setQuery(label);
          setResults([]);
          onLocationChange(lat, lng, label);

          const map = mapInstance.current;
          if (map) {
            map.flyTo({ center: [lng, lat], zoom: 17 });
            markerRef.current?.remove();
            import("mapbox-gl").then((mod) => {
              const mbgl = (mod.default ?? mod) as unknown as MapboxGL;
              markerRef.current = new mbgl.Marker({ color: "#059669" }).setLngLat([lng, lat]).addTo(map);
            });
          }
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function selectResult(result: LocationResult) {
    const [lng, lat] = result.center;
    setQuery(result.place_name);
    setResults([]);
    onLocationChange(lat, lng, result.place_name);

    const map = mapInstance.current;
    if (!map) return;
    markerRef.current?.remove();
    map.flyTo({ center: [lng, lat], zoom: 14 });

    import("mapbox-gl").then((mod) => {
      const mbgl = (mod.default ?? mod) as unknown as MapboxGL;
      markerRef.current = new mbgl.Marker({ color: "#059669" }).setLngLat([lng, lat]).addTo(map);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address or click the map…"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
        />
        <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
          <Search className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={handleCurrentLocation} disabled={locating} title="Use current location">
          <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
        </Button>
      </div>
      {results.length > 0 && (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          {results.map((r, i) => (
            <button key={i} type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 border-b last:border-0"
              onClick={() => selectResult(r)}>
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {r.place_name}
            </button>
          ))}
        </div>
      )}
      <div ref={mapRef} className="h-64 rounded-lg overflow-hidden border bg-slate-100" style={{ cursor: "crosshair" }} />
      {!mapLoaded && <p className="text-xs text-slate-400 text-center">Click map to pin job location</p>}
    </div>
  );
}
