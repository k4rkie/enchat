import type { Request, Response } from "express";
import type { Server, Socket } from "socket.io";
import { getCurrentTime } from "@/utils/utils";

type newMessageObj = {
  userId: string;
  msgPayload: {
    msgText: string;
    iv: string;
  };
  roomId: string;
  userName: string;
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
  userId: string;
  roomName: string;
  userName: string;
  publicKey: PublicKeyJwk;
};

type Room = {
  roomId: string;
  roomName: string;
  messages: messageObj[];
  expiresAt: number;
  users: Set<string>;
  adminId: string;
  adminSecret: string;
  publicKeys: Map<string, PublicKeyJwk>;
};

const roomStore = new Map<string, Room>();

function checkRoom(req: Request, res: Response) {
  const roomId = req.query.roomId;
  const roomKey = `r-${roomId}`;
  if (!roomId) {
    return res.status(400).json({
      error: "Room Id is required",
    });
  }
  if (!roomStore.has(roomKey)) {
    return res.status(404).json({
      error: "Room with provided id doesn't exist",
    });
  }
  if (roomStore.get(roomKey)?.users.size == 2) {
    return res.status(400).json({
      error: "Room is already full",
    });
  }
  return res.status(200).json({
    message: "Room check successful",
  });
}

//do stuff after a user joins/creates a new room
function handleRoomJoin(joinRoomObj: joinRoomObj, socket: Socket, io: Server) {
  const roomKey = `r-${joinRoomObj.roomId}`;

  socket.join(roomKey);

  if (!roomStore.has(roomKey)) {
    const adminSecret = crypto.randomUUID();
    roomStore.set(roomKey, {
      roomId: joinRoomObj.roomId,
      roomName: joinRoomObj.roomName,
      messages: [
        {
          roomId: joinRoomObj.roomId,
          userId: joinRoomObj.userId,
          sysMsg: `${joinRoomObj.userName} created the room`,
          userName: joinRoomObj.userName,
          msgTimestamp: getCurrentTime(),
          type: "sysmsg",
        },
      ],
      expiresAt: Date.now() + 30 * 60 * 1000,
      users: new Set([joinRoomObj.userId]),
      adminId: joinRoomObj.userId,
      adminSecret,
      publicKeys: new Map().set(joinRoomObj.userId, joinRoomObj.publicKey),
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
    if (!room.users.has(joinRoomObj.userId)) {
      room.users.add(joinRoomObj.userId);
      room.messages.push({
        roomId: joinRoomObj.roomId,
        userId: joinRoomObj.userId,
        sysMsg: `${joinRoomObj.userName} joined the room`,
        userName: joinRoomObj.userName,
        msgTimestamp: getCurrentTime(),
        type: "sysmsg",
      });
    }
    room.publicKeys.set(joinRoomObj.userId, joinRoomObj.publicKey);
  }

  const room = roomStore.get(roomKey)!;
  const roomHistory = {
    roomId: room.roomId,
    roomName: room.roomName,
    messages: room.messages,
    expiresAt: room.expiresAt,
    noOfUsers: room.users.size,
    adminId: room.adminId,
    publicKeys: Object.fromEntries(room.publicKeys),
  };

  io.to(roomKey).emit("room-history", roomHistory);
}

//do stuff after a new message is sent
function handleNewMessage(newMessage: newMessageObj, io: Server) {
  const { userId, msgPayload, roomId, userName } = newMessage;
  const roomKey = `r-${roomId}`;
  const room = roomStore.get(roomKey);

  if (!room) return;

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

function handleTerminateRoom(terminateRoomObj: {roomId: string, adminSecret: string}, io: Server) {
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

export { checkRoom, handleNewMessage, handleRoomJoin, handleTerminateRoom };
