import { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { SkillPicker } from "@/components/profile/SkillPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LocateFixed, Loader2 } from "lucide-react";
import type { UserSkill } from "@/types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

interface Profile {
  name: string;
  bio: string;
  phone: string;
  avatarUrl: string | null;
  address: Address;
  latitude: number | null;
  longitude: number | null;
  skills: UserSkill[];
}

const emptyAddress: Address = { street: "", city: "", state: "", country: "", zip: "" };

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: "", bio: "", phone: "", avatarUrl: null,
    address: emptyAddress, latitude: null, longitude: null, skills: [],
  });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api
      .get("/api/users/me")
      .then((r) => {
        const u = r.data.user;
        if (u) {
          setProfile({
            name: u.name ?? "",
            bio: u.bio ?? "",
            phone: u.phone ?? "",
            avatarUrl: u.avatarUrl ?? null,
            address: u.address ?? emptyAddress,
            latitude: u.location?.coordinates?.[1] ?? null,
            longitude: u.location?.coordinates?.[0] ?? null,
            skills: u.skills ?? [],
          });
        }
      })
      .finally(() => setFetching(false));
  }, []);

  function setAddr(key: keyof Address, value: string) {
    setProfile((p) => ({ ...p, address: { ...p.address, [key]: value } }));
  }

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation || !MAPBOX_TOKEN) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address&limit=1`;
          const res = await fetch(url);
          const data = await res.json();
          const feature = data.features?.[0];
          if (feature) {
            const ctx = feature.context ?? [];
            const get = (type: string) =>
              ctx.find((c: { id: string; text: string }) => c.id.startsWith(type))?.text ?? "";
            setProfile((p) => ({
              ...p,
              latitude: lat,
              longitude: lng,
              address: {
                street: feature.text ?? "",
                city: get("place"),
                state: get("region"),
                country: get("country"),
                zip: get("postcode"),
              },
            }));
          } else {
            setProfile((p) => ({ ...p, latitude: lat, longitude: lng }));
          }
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await api.patch("/api/users/me", {
          name: profile.name,
          bio: profile.bio || undefined,
          phone: profile.phone || undefined,
          avatarUrl: profile.avatarUrl || undefined,
          address: profile.address,
          latitude: profile.latitude ?? undefined,
          longitude: profile.longitude ?? undefined,
          skills: profile.skills.map(({ category, yearsExp }) => ({
            category,
            ...(yearsExp != null ? { yearsExp } : {}),
          })),
        });
        await refreshUser();
        toast.success("Profile updated!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast.error(msg ?? "Failed to save profile");
      }
    });
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AvatarUpload
                currentUrl={profile.avatarUrl}
                name={profile.name || (user?.name ?? "?")}
                onUpload={(url) => setProfile((p) => ({ ...p, avatarUrl: url }))}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{profile.name}</p>
                <p className="text-xs text-muted-foreground">Click the camera icon to change your photo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell clients/workers about yourself…"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Your Location</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleUseCurrentLocation} disabled={locating} className="gap-1.5">
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                Use Current Location
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input id="street" value={profile.address.street}
                onChange={(e) => setAddr("street", e.target.value)}
                placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={profile.address.city}
                  onChange={(e) => setAddr("city", e.target.value)}
                  placeholder="New York" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" value={profile.address.state}
                  onChange={(e) => setAddr("state", e.target.value)}
                  placeholder="NY" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={profile.address.country}
                  onChange={(e) => setAddr("country", e.target.value)}
                  placeholder="United States" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP / Postal Code</Label>
                <Input id="zip" value={profile.address.zip}
                  onChange={(e) => setAddr("zip", e.target.value)}
                  placeholder="10001" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills (Worker Profile)</CardTitle>
            <p className="text-sm text-muted-foreground">Select the trades you can perform</p>
          </CardHeader>
          <CardContent>
            <SkillPicker
              skills={profile.skills}
              onChange={(skills) => setProfile((p) => ({ ...p, skills }))}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
          {pending ? "Saving…" : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
