import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User";
import { type AuthRequest } from "../middleware/auth";

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signAccess(userId: string, email: string) {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  } as jwt.SignOptions);
}

function signRefresh(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  } as jwt.SignOptions);
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as z.infer<typeof RegisterSchema>;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const accessToken = signAccess(user._id.toString(), user.email);
  const refreshToken = signRefresh(user._id.toString());

  user.refreshTokens.push(refreshToken);
  await user.save();

  setRefreshCookie(res, refreshToken);
  res.status(201).json({
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as z.infer<typeof LoginSchema>;

  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const accessToken = signAccess(user._id.toString(), user.email);
  const refreshToken = signRefresh(user._id.toString());

  // Keep at most 5 refresh tokens (multi-device)
  user.refreshTokens = [...user.refreshTokens.slice(-4), refreshToken];
  await user.save();

  setRefreshCookie(res, refreshToken);
  res.json({
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const newRefresh = signRefresh(payload.userId);

  // Atomic token rotation — avoids version conflicts from concurrent requests
  const user = await User.findOneAndUpdate(
    { _id: payload.userId, refreshTokens: token },
    [
      {
        $set: {
          refreshTokens: {
            $concatArrays: [
              { $filter: { input: "$refreshTokens", cond: { $ne: ["$$this", token] } } },
              [newRefresh],
            ],
          },
        },
      },
    ],
    { new: true }
  );

  if (!user) {
    res.status(401).json({ error: "Refresh token revoked" });
    return;
  }

  const accessToken = signAccess(user._id.toString(), user.email);
  setRefreshCookie(res, newRefresh);
  res.json({ accessToken });
}

export async function logout(req: AuthRequest, res: Response) {
  const token = req.cookies?.refreshToken;
  if (token) {
    await User.findByIdAndUpdate(req.user!.userId, {
      $pull: { refreshTokens: token },
    });
    res.clearCookie("refreshToken");
  }
  res.json({ success: true });
}
