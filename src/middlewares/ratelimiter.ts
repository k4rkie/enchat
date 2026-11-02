import type { Request, Response, NextFunction } from "express";

type AttemptsT = "room_create" | "room_join";

const ONEHOUR = 60 * 60 * 1000;
const attemptsStore = new Map<string, Map<string, Array<number>>>();
setInterval(cleanupAttemptsStore, 15 * 60 * 1000);

export default function rateLimiter(attempt: AttemptsT) {
  return (req: Request, res: Response, next: NextFunction) => {
    let clientIp = req.ip?.toLowerCase();
    let userId =
      typeof req.query.userId === "string" ? req.query.userId : "anon";

    if (clientIp && clientIp.startsWith("::ffff:")) {
      clientIp = clientIp.replace("::ffff:", "");
    }
    console.log("Req by:", clientIp);

    const storeKey = `${clientIp}-${userId}`;

    if (!attemptsStore.has(storeKey)) {
      let attemptMap = new Map();

      attemptMap.set("roomCreated", []);
      attemptMap.set("roomJoined", []);
      attemptsStore.set(storeKey, attemptMap);
    }

    if (attempt == "room_create") {
      let timestampArray =
        attemptsStore.get(storeKey)?.get("roomCreated") || [];

      const now = Date.now();

      const validTimestamps = timestampArray.filter((t) => now - t < ONEHOUR);

      if (validTimestamps.length >= 3) {
        return res
          .status(429)
          .json({ error: "Too many room creation attempts!!" });
      }

      validTimestamps.push(now);
      attemptsStore.get(storeKey)?.set("roomCreated", validTimestamps);
    }
    if (attempt == "room_join") {
      const timestampArray =
        attemptsStore.get(storeKey)?.get("roomJoined") || [];
      const now = Date.now();
      const validTimestamps = timestampArray.filter((t) => now - t < ONEHOUR);

      if (validTimestamps.length >= 10) {
        return res.status(429).json({ error: "Too many room join attempts!!" });
      }

      validTimestamps.push(Date.now());
      attemptsStore.get(storeKey)?.set("roomJoined", validTimestamps);
    }

    next();
  };
}

function cleanupAttemptsStore() {
  const now = Date.now();
  for (const [storeKey, attemptMap] of attemptsStore.entries()) {
    const createdArr = attemptMap.get("roomCreated") || [];
    const joinedArr = attemptMap.get("roomJoined") || [];

    const lastCreated = createdArr[createdArr.length - 1] || 0;
    const lastJoined = joinedArr[joinedArr.length - 1] || 0;

    const lastRequest = Math.max(lastJoined, lastCreated);

    if (now - lastRequest >= ONEHOUR) {
      attemptsStore.delete(storeKey);
    }
  }
  console.log("Attempts store clenup complete");
}
