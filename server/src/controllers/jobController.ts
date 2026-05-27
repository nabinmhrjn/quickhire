import { Response } from "express";
import { z } from "zod";
import Job from "../models/Job";
import { type AuthRequest } from "../middleware/auth";
import { findNearbyJobs, findMatchedWorkers } from "../lib/geo";
import { createNotifications } from "../lib/notifications";
import { SKILL_CATEGORIES, URGENCY_LEVELS, type SkillCategory } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICAL: "electrician",
  PLUMBING: "plumber",
  CARPENTRY: "carpenter",
  PAINTING: "painter",
  HVAC: "HVAC technician",
  LANDSCAPING: "landscaper",
  CLEANING: "cleaner",
  GENERAL_HANDYMAN: "handyman",
  ROOFING: "roofer",
  TILING: "tiler",
  APPLIANCE_REPAIR: "appliance repair technician",
  PEST_CONTROL: "pest control specialist",
};

export const CreateJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  category: z.enum(SKILL_CATEGORIES),
  urgency: z.enum(URGENCY_LEVELS).default("FLEXIBLE"),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationLabel: z.string().min(1),
  preferredDate: z.string().datetime().optional(),
  photoUrls: z.array(z.string().url()).optional(),
});

export const UpdateJobSchema = CreateJobSchema.partial().extend({
  status: z.enum(["OPEN", "IN_REVIEW", "ASSIGNED", "COMPLETED", "CANCELLED"]).optional(),
});

export async function listJobs(req: AuthRequest, res: Response) {
  const lat = parseFloat((req.query.lat as string) ?? "0");
  const lng = parseFloat((req.query.lng as string) ?? "0");
  const radius = parseInt((req.query.radius as string) ?? "25000");
  const category = req.query.category as string | undefined;
  const status = (req.query.status as string) ?? "OPEN";
  const page = parseInt((req.query.page as string) ?? "1");
  const limit = parseInt((req.query.limit as string) ?? "20");
  const clientId = req.query.clientId as string | undefined;

  if (!lat || !lng) {
    if (clientId) {
      const [jobs, total] = await Promise.all([
        Job.find({ clientId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Job.countDocuments({ clientId }),
      ]);
      res.json({ jobs, total });
      return;
    }
    res.json({ jobs: [], total: 0 });
    return;
  }

  const { jobs, total } = await findNearbyJobs({
    latitude: lat,
    longitude: lng,
    radiusMeters: radius,
    categories: category ? ([category] as SkillCategory[]) : undefined,
    status,
    page,
    limit,
  });

  res.json({ jobs, total });
}

export async function createJob(req: AuthRequest, res: Response) {
  const { photoUrls, preferredDate, latitude, longitude, ...jobData } =
    req.body as z.infer<typeof CreateJobSchema>;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const job = await Job.create({
    ...jobData,
    clientId: req.user!.userId,
    location: { type: "Point", coordinates: [longitude, latitude] },
    photos: photoUrls?.map((url, i) => ({ url, order: i })) ?? [],
    expiresAt,
    preferredDate: preferredDate ? new Date(preferredDate) : undefined,
  });

  const skill = CATEGORY_LABELS[job.category] ?? job.category.toLowerCase();

  findMatchedWorkers(latitude, longitude, job.category)
    .then((workerIds) => {
      const filtered = workerIds.filter((id) => id !== req.user!.userId);
      return createNotifications(
        filtered,
        "NEW_JOB_NEARBY",
        `Someone is looking for a ${skill} near you`,
        `"${job.title}" in ${job.locationLabel} · Budget $${job.budgetMin}–$${job.budgetMax}`,
        { jobId: job._id.toString() }
      );
    })
    .catch(console.error);

  res.status(201).json({ job });
}

export async function getJob(req: AuthRequest, res: Response) {
  const job = await Job.findById(req.params.jobId).populate(
    "clientId",
    "name avatarUrl clientRating clientRatingCount locationLabel"
  );
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  Job.findByIdAndUpdate(req.params.jobId, { $inc: { viewCount: 1 } }).exec();

  res.json({ job });
}

export async function updateJob(req: AuthRequest, res: Response) {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.clientId.toString() !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { latitude, longitude, photoUrls, preferredDate, ...rest } =
    req.body as z.infer<typeof UpdateJobSchema>;

  const update: Record<string, unknown> = { ...rest };
  if (latitude !== undefined && longitude !== undefined) {
    update.location = { type: "Point", coordinates: [longitude, latitude] };
  }
  if (photoUrls !== undefined) {
    update.photos = photoUrls.map((url, i) => ({ url, order: i }));
  }
  if (preferredDate !== undefined) {
    update.preferredDate = new Date(preferredDate);
  }

  const updated = await Job.findByIdAndUpdate(req.params.jobId, update, { new: true });
  res.json({ job: updated });
}

export async function deleteJob(req: AuthRequest, res: Response) {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.clientId.toString() !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await job.deleteOne();
  res.json({ success: true });
}
