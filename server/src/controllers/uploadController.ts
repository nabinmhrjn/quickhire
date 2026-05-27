import { Response } from "express";
import multer from "multer";
import { cloudinary } from "../config/cloudinary";
import { type AuthRequest } from "../middleware/auth";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, overwrite: true },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function uploadAvatar(req: AuthRequest, res: Response) {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const result = await uploadToCloudinary(
    req.file.buffer,
    "quickhire/avatars",
    `avatar_${req.user!.userId}`
  );

  res.json({ url: result.secure_url });
}

export async function uploadJobPhoto(req: AuthRequest, res: Response) {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const result = await uploadToCloudinary(
    req.file.buffer,
    "quickhire/job-photos",
    `job_${req.user!.userId}_${Date.now()}`
  );

  res.json({ url: result.secure_url });
}
