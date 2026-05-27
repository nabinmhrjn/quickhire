import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewList } from "@/components/reviews/ReviewList";
import { MapPin, Star, Loader2 } from "lucide-react";
import type { Review, User } from "@/types";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api
      .get(`/api/users/${userId}`)
      .then((r) => {
        setUser(r.data.user);
        setReviews(r.data.reviews ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  if (!user) return <div className="p-6 text-center text-muted-foreground">User not found.</div>;

  const workerReviews = reviews.filter((r) => r.authorRole === "CLIENT");
  const clientReviews = reviews.filter((r) => r.authorRole === "WORKER");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={user.avatarUrl ?? ""} />
              <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
              {(user.address?.street || user.address?.city || user.locationLabel) && (
                <div className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div>
                    {user.address?.street && (
                      <p>{user.address.street}</p>
                    )}
                    {(user.address?.city || user.address?.state || user.address?.country) ? (
                      <p>
                        {[user.address.city, user.address.state, user.address.country]
                          .filter(Boolean).join(", ")}
                        {user.address.zip ? ` ${user.address.zip}` : ""}
                      </p>
                    ) : user.locationLabel ? (
                      <p>{user.locationLabel}</p>
                    ) : null}
                  </div>
                </div>
              )}
              {user.bio && <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>}
              <div className="flex gap-4 mt-3">
                {user.workerRatingCount > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{user.workerRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">Worker ({user.workerRatingCount})</span>
                  </div>
                )}
                {user.clientRatingCount > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-blue-400 text-blue-400" />
                    <span className="font-semibold">{user.clientRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">Client ({user.clientRatingCount})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {user.skills.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {user.skills.map((s) => (
              <Badge key={s.category} variant="secondary">
                {s.category.replace("_", " ")}
                {s.yearsExp ? ` · ${s.yearsExp}yr` : ""}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-0">
          <Tabs defaultValue="worker">
            <TabsList className="mt-6 mb-4">
              <TabsTrigger value="worker">Worker Reviews ({workerReviews.length})</TabsTrigger>
              <TabsTrigger value="client">Client Reviews ({clientReviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="worker">
              <ReviewList reviews={workerReviews} />
            </TabsContent>
            <TabsContent value="client">
              <ReviewList reviews={clientReviews} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
