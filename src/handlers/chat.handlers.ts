import type { Request, Response } from "express";
import { randomInt } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { getCurrentTime } from "@/utils/utils";
import { signRoomAccessToken } from "@/auth/access.helper";

type newMessageObj = {
  msgPayload: {
    msgText: string;
    iv: string;
  };
};

type PublicKeyJwk = {
  kty: string;
  crv: string;
  x: string;
  y: string;
};

type messageObj =
  | {
      userId: string;
      msgPayload: {
        msgText: string;
        iv: string;
      };
      roomId: string;
      userName: string;
      msgTimestamp: string;
      type: "text";
    }
  | {
      userId: string;
      sysMsg: string;
      roomId: string;
      userName: string;
      msgTimestamp: string;
      type: "sysmsg";
    };

type joinRoomObj = {
  roomId: string;
  roomName: string;
  userName: string;
  publicKey: PublicKeyJwk;
};

type Room = {
  roomId: string;
  roomName: string;
  messages: messageObj[];
  expiresAt: number;
  users: Map<string, boolean>;
  adminId: string;
  adminSecret: string;
  publicKeys: Map<string, PublicKeyJwk>;
};

const socketToUserIdMap = new Map<string, string>();
const userIdToUserNameMap = new Map<string, string>();
const roomStore = new Map<string, Room>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

const ROOM_ID_LENGTH = 8;
const DISCONNECT_GRACE_PERIOD_MS = 5000;
const ROOM_ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRoomId() {
  let roomId = "";

  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    roomId += ROOM_ID_ALPHABET.charAt(randomInt(ROOM_ID_ALPHABET.length));
  }

  return roomId;
}

async function createRoom(req: Request, res: Response) {
  const { userId } = req;
  let roomId = generateRoomId();

  while (roomStore.has(`r-${roomId}`)) {
    roomId = generateRoomId();
  }

  const roomAccessToken = await signRoomAccessToken({
    userId,
    roomId,
    action: "create",
  });
  return res.status(200).json({
    message: "Room creation successful",
    roomId,
    token: roomAccessToken,
  });
}

async function checkRoom(req: Request, res: Response) {
  const { userId, roomId } = req;

  if (!roomId) {
    return res.status(400).json({
      error: "RoomId is required",
    });
  }

  const roomKey = `r-${roomId}`;
  const room = roomStore.get(roomKey);

  if (!room) {
    return res.status(404).json({
      error: "Room with provided id doesn't exist",
    });
  }
  if (room.users.size >= 2 && !room.users.has(userId)) {
    return res.status(400).json({
      error: "Room is already full",
    });
  }
  const roomAccessToken = await signRoomAccessToken({
    userId,
    roomId,
    action: "join",
  });
  return res.status(200).json({
    message: "Room check successful",
    token: roomAccessToken,
  });
}

//do stuff after a user joins/creates a new room
function handleRoomJoin(joinRoomObj: joinRoomObj, socket: Socket, io: Server) {
  const { userId, roomId, action } = socket.data;

  if (!userId || !roomId || joinRoomObj.roomId !== roomId) {
    return;
  }

  const roomKey = `r-${roomId}`;
  const existingRoom = roomStore.get(roomKey);
  const disconnectTimerKey = `${roomKey}:${userId}`;
  const disconnectTimer = disconnectTimers.get(disconnectTimerKey);

  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimers.delete(disconnectTimerKey);
  }

  if (action === "create") {
    if (existingRoom && existingRoom.adminId !== userId) {
      return;
    }
  } else {
    if (!existingRoom) {
      return;
    }

    if (existingRoom.users.size >= 2 && !existingRoom.users.has(userId)) {
      return;
    }
  }

  socketToUserIdMap.set(socket.id, userId);
  userIdToUserNameMap.set(userId, joinRoomObj.userName);

  socket.join(roomKey);

  if (!existingRoom) {
    const adminSecret = crypto.randomUUID();
    roomStore.set(roomKey, {
      roomId,
      roomName: joinRoomObj.roomName,
      messages: [
        {
          roomId,
          userId: userId,
          sysMsg: `${joinRoomObj.userName} created the room`,
          userName: joinRoomObj.userName,
          msgTimestamp: getCurrentTime(),
          type: "sysmsg",
        },
      ],
      expiresAt: Date.now() + 30 * 60 * 1000,
      users: new Map([[userId, true]]),
      adminId: userId,
      adminSecret,
      publicKeys: new Map().set(userId, joinRoomObj.publicKey),
    });

    // private: only creator gets the secret, never broadcast
    socket.emit("admin-secret", { adminSecret });

    setTimeout(
      () => {
        if (roomStore.has(roomKey)) {
          roomStore.delete(roomKey);
          io.to(roomKey).emit("room-expired", "The room has expired");
        }
      },
      30 * 60 * 1000,
    );
  } else {
    const room = roomStore.get(roomKey)!;
    if (!room.users.has(userId)) {
      room.users.set(userId, true);
      room.messages.push({
        roomId,
        userId: userId,
        sysMsg: `${joinRoomObj.userName} joined the room`,
        userName: joinRoomObj.userName,
        msgTimestamp: getCurrentTime(),
        type: "sysmsg",
      });
    } else {
      room.users.set(userId, true);
    }
    room.publicKeys.set(userId, joinRoomObj.publicKey);
  }

  const room = roomStore.get(roomKey)!;
  const activeUserCount = [...room.users.values()].filter(Boolean).length;
  const roomHistory = {
    roomId: room.roomId,
    roomName: room.roomName,
    messages: room.messages,
    expiresAt: room.expiresAt,
    noOfUsers: activeUserCount,
    adminId: room.adminId,
    publicKeys: Object.fromEntries(room.publicKeys),
  };

  io.to(roomKey).emit("room-history", roomHistory);
}

//handle new message
function handleNewMessage(
  newMessage: newMessageObj,
  socket: Socket,
  io: Server,
) {
  const { msgPayload } = newMessage;
  const { userId, roomId } = socket.data;

  if (!userId || !roomId) {
    return;
  }

  const userName = userIdToUserNameMap.get(userId);

  if (!userName) {
    return;
  }

  const roomKey = `r-${roomId}`;

  if (!socket.rooms.has(roomKey)) {
    return;
  }

  const room = roomStore.get(roomKey);
  if (!room) {
    return;
  }

  if (room.expiresAt <= Date.now()) {
    roomStore.delete(roomKey);
    io.to(roomKey).emit("room-expired", "The room has expired");
    return;
  }

  if (room.users.get(userId) !== true) {
    return;
  }

  if (
    !msgPayload ||
    typeof msgPayload !== "object" ||
    typeof msgPayload.msgText !== "string" ||
    typeof msgPayload.iv !== "string" ||
    msgPayload.msgText.length === 0 ||
    msgPayload.msgText.length > 2000 ||
    msgPayload.iv.length === 0
  ) {
    return;
  }

  const msgTimestamp = getCurrentTime();
  const message: messageObj = {
    userId,
    msgPayload,
    roomId,
    userName,
    msgTimestamp,
    type: "text",
  };

  room.messages.push(message);

  io.to(roomKey).emit("newMessage", message);
}

function handleTerminateRoom(
  terminateRoomObj: { roomId: string; adminSecret: string },
  io: Server,
) {
  const roomKey = `r-${terminateRoomObj.roomId}`;
  const room = roomStore.get(roomKey);
  if (!room) return;
  if (room.adminSecret !== terminateRoomObj.adminSecret) return;
  roomStore.delete(roomKey);
  console.log(
    `Room with id: ${terminateRoomObj.roomId} has been removed form the room store`,
  );
  io.to(roomKey).emit(
    "terminate-room-successful",
    "Room Terminated Successfully",
  );
}

function handleDisconnecting(socket: Socket, io: Server) {
  const userId = socketToUserIdMap.get(socket.id);
  if (!userId) return;

  const disconnectedUserName = userIdToUserNameMap.get(userId) ?? userId;

  socketToUserIdMap.delete(socket.id);

  for (const roomKey of socket.rooms) {
    if (roomKey === socket.id) continue;

    const disconnectTimerKey = `${roomKey}:${userId}`;
    const disconnectTimer = setTimeout(() => {
      disconnectTimers.delete(disconnectTimerKey);

      const room = roomStore.get(roomKey);
      if (!room) return;

      if (userId === room.adminId) {
        roomStore.delete(roomKey);
        io.to(roomKey).emit(
          "terminate-room-successful",
          "Room Terminated Successfully",
        );
        userIdToUserNameMap.delete(userId);
        return;
      }

      room.users.set(userId, false);

      if ([...room.users.values()].some(Boolean)) {
        const leaveMessage: messageObj = {
          roomId: room.roomId,
          userId,
          sysMsg: `${disconnectedUserName} left the room`,
          userName: disconnectedUserName,
          msgTimestamp: getCurrentTime(),
          type: "sysmsg",
        };

        room.messages.push(leaveMessage);
        io.to(roomKey).emit("newMessage", leaveMessage);

        const activeUserCount = [...room.users.values()].filter(Boolean).length;
        io.to(roomKey).emit("room-history", {
          roomId: room.roomId,
          roomName: room.roomName,
          messages: room.messages,
          expiresAt: room.expiresAt,
          noOfUsers: activeUserCount,
          adminId: room.adminId,
          publicKeys: Object.fromEntries(room.publicKeys),
        });
      }

      userIdToUserNameMap.delete(userId);
    }, DISCONNECT_GRACE_PERIOD_MS);

    disconnectTimers.set(disconnectTimerKey, disconnectTimer);
  }
}

export {
  createRoom,
  checkRoom,
  handleNewMessage,
  handleRoomJoin,
  handleTerminateRoom,
  handleDisconnecting,
};
