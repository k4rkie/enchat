import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      roomId?: string;
    }
  }
}

export default function checkRoomAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.query.userId;
  const roomId = req.query.roomId;

  if (typeof userId !== "string" || userId.length === 0) {
    return res.status(401).json({ error: "UserId missing for authentication" });
  }

  if (roomId !== undefined) {
    if (typeof roomId !== "string" || roomId.length === 0) {
      return res.status(400).json({ error: "RoomId is required" });
    }
    req.roomId = roomId;
  }

  req.userId = userId;

  next();
}
