import { SignJWT, jwtVerify } from "jose";

type RoomAccessAction = "create" | "join";

type RoomAccessClaims = {
  userId: string;
  roomId: string;
  action: RoomAccessAction;
};

const ROOM_ACCESS_TTL = "30m";

function getSecret() {
  const secret = process.env.ROOM_ACCESS_SECRET;
  if (!secret) {
    throw new Error("ROOM_ACCESS_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

async function signRoomAccessToken({
  userId,
  roomId,
  action,
}: RoomAccessClaims) {
  return new SignJWT({ roomId, action })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ROOM_ACCESS_TTL)
    .sign(getSecret());
}

async function verifyRoomAccessToken(
  token: string,
): Promise<RoomAccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.roomId !== "string" ||
      (payload.action !== "create" && payload.action !== "join")
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      roomId: payload.roomId,
      action: payload.action,
    };
  } catch {
    return null;
  }
}

export type { RoomAccessAction, RoomAccessClaims };
export { signRoomAccessToken, verifyRoomAccessToken };
