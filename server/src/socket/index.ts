import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "../types";

let io: IOServer;

export function initSocket(httpServer: HttpServer) {
  io = new IOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:3000",
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      (socket as Socket & { userId: string }).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as Socket & { userId: string }).userId;
    // Each user joins their own private room so we can push targeted notifications
    socket.join(`user:${userId}`);

    socket.on("disconnect", () => {
      socket.leave(`user:${userId}`);
    });
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error("Socket.io has not been initialised");
  return io;
}
