import { Request, Response } from "express";
import { z } from "zod";
import User from "../models/User";
import Review from "../models/Review";
import { type AuthRequest } from "../middleware/auth";

const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  address: AddressSchema.optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  searchRadius: z.number().min(1000).max(100000).optional(),
  avatarUrl: z.string().url().optional(),
  skills: z
    .array(z.object({ category: z.string(), yearsExp: z.number().min(0).max(50).optional() }))
    .optional(),
});

export async function getMe(req: AuthRequest, res: Response) {
  const user = await User.findById(req.user!.userId).select("-passwordHash -refreshTokens");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
}

export async function updateMe(req: AuthRequest, res: Response) {
  const { skills, address, latitude, longitude, searchRadius, ...profileData } =
    req.body as z.infer<typeof UpdateProfileSchema>;

  const update: Record<string, unknown> = { ...profileData };

  if (address !== undefined) {
    update.address = address;
    const parts = [address.street, address.city, address.state, address.country]
      .filter(Boolean);
    if (parts.length) update.locationLabel = parts.join(", ");
  }
  if (latitude !== undefined && longitude !== undefined) {
    update.location = { type: "Point", coordinates: [longitude, latitude] };
  }
  if (searchRadius !== undefined) update.searchRadius = searchRadius;
  if (skills !== undefined) update.skills = skills;

  const user = await User.findByIdAndUpdate(req.user!.userId, update, { new: true }).select(
    "-passwordHash -refreshTokens"
  );

  res.json({ user });
}

export async function getPublicProfile(req: Request, res: Response) {
  const user = await User.findById(req.params.userId).select(
    "name avatarUrl bio locationLabel workerRating workerRatingCount clientRating clientRatingCount skills createdAt"
  );
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const reviews = await Review.find({ subjectId: req.params.userId })
    .populate("authorId", "name avatarUrl")
    .populate("jobId", "title category")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ user, reviews });
}
