import { Request, Response } from "express";
import { z } from "zod";
import Review from "../models/Review";
import Job from "../models/Job";
import User from "../models/User";
import Application from "../models/Application";
import { type AuthRequest } from "../middleware/auth";
import { createNotification } from "../lib/notifications";

export const CreateReviewSchema = z.object({
  jobId: z.string(),
  subjectId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10),
});

export async function getReviews(req: Request, res: Response) {
  const { subjectId, role } = req.query as { subjectId?: string; role?: string };
  const filter: Record<string, unknown> = {};
  if (subjectId) filter.subjectId = subjectId;
  if (role) filter.authorRole = role;

  const reviews = await Review.find(filter)
    .populate("authorId", "name avatarUrl")
    .populate("jobId", "title category")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ reviews });
}

export async function createReview(req: AuthRequest, res: Response) {
  const { jobId, subjectId, rating, comment } = req.body as z.infer<typeof CreateReviewSchema>;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.status !== "COMPLETED") {
    res.status(400).json({ error: "Can only review completed jobs" });
    return;
  }

  const isClient = job.clientId.toString() === req.user!.userId;
  const acceptedApp = await Application.findOne({ jobId, status: "ACCEPTED" }).select("workerId");
  const isWorker = acceptedApp?.workerId.toString() === req.user!.userId;

  if (!isClient && !isWorker) {
    res.status(403).json({ error: "Not a participant in this job" });
    return;
  }

  const authorRole = isClient ? "CLIENT" : "WORKER";
  const expectedSubjectId = isClient
    ? acceptedApp!.workerId.toString()
    : job.clientId.toString();

  if (subjectId !== expectedSubjectId) {
    res.status(400).json({ error: "Invalid subject" });
    return;
  }

  const review = await Review.create({
    jobId,
    authorId: req.user!.userId,
    subjectId,
    authorRole,
    rating,
    comment,
  });

  const stats = await Review.aggregate([
    { $match: { subjectId: review.subjectId, authorRole } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg = stats[0]?.avg ?? 0;
  const count = stats[0]?.count ?? 0;

  if (authorRole === "CLIENT") {
    await User.findByIdAndUpdate(subjectId, { workerRating: avg, workerRatingCount: count });
  } else {
    await User.findByIdAndUpdate(subjectId, { clientRating: avg, clientRatingCount: count });
  }

  await createNotification(
    subjectId,
    "NEW_REVIEW",
    "You received a new review",
    `${rating} star review for "${job.title}"`,
    { jobId, reviewId: review._id.toString() }
  );

  res.status(201).json({ review });
}
