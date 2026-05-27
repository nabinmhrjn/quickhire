import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import { initSocket } from "./socket";

import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import jobsRouter from "./routes/jobs";
import applicationsRouter from "./routes/applications";
import notificationsRouter from "./routes/notifications";
import reviewsRouter from "./routes/reviews";
import uploadRouter from "./routes/upload";
import geocodeRouter from "./routes/geocode";

const app = express();
const httpServer = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Routes ──────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/geocode", geocodeRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "5000");

connectDB()
  .then(() => {
    initSocket(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
