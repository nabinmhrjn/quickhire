import { Response } from "express";
import { z } from "zod";
import Application from "../models/Application";
import Job from "../models/Job";
import User from "../models/User";
import { type AuthRequest } from "../middleware/auth";
import { createNotification } from "../lib/notifications";

export const ApplicationSchema = z.object({
  proposedAmount: z.number().min(0),

  estimatedDays: z.number().min(1).max(365).optional(),
});

export const UpdateApplicationSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "WITHDRAWN", "SHORTLISTED", "COMPLETED"]),
  rejectionNote: z.string().optional(),
  clientNote: z.string().optional(),
});

export async function getJobApplications(req: AuthRequest, res: Response) {
  const job = await Job.findById(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.clientId.toString() !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const applications = await Application.find({ jobId: req.params.jobId })
    .populate("workerId", "id name avatarUrl bio workerRating workerRatingCount locationLabel skills")
    .sort({ status: 1, createdAt: 1 });

  res.json({ applications });
}

export async function getMyApplications(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const limit = 20;

  const [applications, total] = await Promise.all([
    Application.find({ workerId: req.user!.userId })
      .populate("jobId", "title category status locationLabel budgetMin budgetMax clientId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Application.countDocuments({ workerId: req.user!.userId }),
  ]);

  res.json({ applications, total });
}

export async function applyToJob(req: AuthRequest, res: Response) {
  const { jobId } = req.params;
  const job = await Job.findById(jobId).populate("clientId", "name");
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.status !== "OPEN" && job.status !== "IN_REVIEW") {
    res.status(400).json({ error: "Job is not accepting applications" });
    return;
  }
  if (job.clientId._id.toString() === req.user!.userId) {
    res.status(400).json({ error: "Cannot apply to your own job" });
    return;
  }

  const existing = await Application.findOne({ jobId, workerId: req.user!.userId });
  if (existing) {
    res.status(400).json({ error: "You have already applied to this job" });
    return;
  }

  const application = await Application.create({
    jobId,
    workerId: req.user!.userId,
    ...req.body,
  });

  if (job.status === "OPEN") {
    await Job.findByIdAndUpdate(jobId, { status: "IN_REVIEW" });
  }

  const worker = await User.findById(req.user!.userId).select("name");
  const clientId = (job.clientId as unknown as { _id: { toString(): string } })._id.toString();

  await createNotification(
    clientId,
    "NEW_APPLICATION",
    "New application received",
    `${worker?.name} applied for "${job.title}" — Quote: $${req.body.proposedAmount}`,
    { jobId, applicationId: application._id.toString() }
  );

  res.status(201).json({ application });
}

export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  const application = await Application.findById(req.params.id).populate(
    "jobId",
    "clientId title _id"
  );
  if (!application) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const job = application.jobId as unknown as {
    clientId: { toString(): string };
    title: string;
    _id: { toString(): string };
  };

  const { status, rejectionNote, clientNote } =
    req.body as z.infer<typeof UpdateApplicationSchema>;
  const isClient = job.clientId.toString() === req.user!.userId;
  const isWorker = application.workerId.toString() === req.user!.userId;

  if (["ACCEPTED", "REJECTED", "SHORTLISTED"].includes(status) && !isClient) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (status === "WITHDRAWN" && !isWorker) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (status === "COMPLETED" && !isClient) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  application.status = status as typeof application.status;
  if (rejectionNote !== undefined) application.rejectionNote = rejectionNote;
  if (clientNote !== undefined) application.clientNote = clientNote;
  await application.save();

  if (status === "ACCEPTED") {
    await Application.updateMany(
      { jobId: application.jobId, _id: { $ne: application._id }, status: "PENDING" },
      { status: "REJECTED" }
    );
    await Job.findByIdAndUpdate(application.jobId, { status: "ASSIGNED" });

    await createNotification(
      application.workerId.toString(),
      "APPLICATION_ACCEPTED",
      "Application accepted!",
      `You've been hired for "${job.title}"`,
      { jobId: job._id.toString(), applicationId: application._id.toString() }
    );
  } else if (status === "REJECTED") {
    await createNotification(
      application.workerId.toString(),
      "APPLICATION_REJECTED",
      "Application not selected",
      `Your application for "${job.title}" was not selected`,
      { jobId: job._id.toString(), applicationId: application._id.toString() }
    );
  } else if (status === "COMPLETED") {
    await Job.findByIdAndUpdate(application.jobId, { status: "COMPLETED" });

    await createNotification(
      application.workerId.toString(),
      "JOB_COMPLETED",
      "Job marked as complete",
      `"${job.title}" has been marked complete. Please leave a review!`,
      { jobId: job._id.toString() }
    );
  }

  res.json({ application });
}
