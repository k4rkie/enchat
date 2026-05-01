import type { Request, Response } from "express";
import type { Server, Socket } from "socket.io";
import { getCurrentTime } from "../utils/utils";
import { join } from "node:path/posix";

type newMessageObj = {
  userId: string;
  msg: string;
  roomId: string;
  userName: string;
};

type messageObj = {
  userId: string;
  msg: string;
  roomId: string;
  userName: string;
  msgTimestamp: string;
  type: "text" | "system_msg";
};

type joinRoomObj = {
  roomId: string;
  userId: string;
  roomName: string;
  userName: string;
};

type Room = {
  roomId: string;
  roomName: string;
  messages: messageObj[];
  expiresAt: number;
  users: Set<string>;
  adminId: string;
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
  return res.status(200).json({
    message: "Room check successful",
  });
}

//do stuff after a user joins/creates a new room
function handleRoomJoin(joinRoomObj: joinRoomObj, socket: Socket, io: Server) {
  const roomKey = `r-${joinRoomObj.roomId}`;

  socket.join(roomKey);

  if (!roomStore.has(roomKey)) {
    roomStore.set(roomKey, {
      roomId: joinRoomObj.roomId,
      roomName: joinRoomObj.roomName,
      messages: [],
      expiresAt: Date.now() + 30 * 60 * 1000,
      users: new Set([joinRoomObj.userId]),
      adminId: joinRoomObj.userId,
    });

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
    roomStore.get(roomKey)!.users.add(joinRoomObj.userId);
    roomStore.get(roomKey)?.messages.push({
      roomId: joinRoomObj.roomId,
      userId: joinRoomObj.userId,
      msg: `${joinRoomObj.userName} joined the room`,
      userName: joinRoomObj.userName,
      msgTimestamp: getCurrentTime(),
      type: "system_msg",
    });
  }

  const room = roomStore.get(roomKey)!;
  const roomHistory = {
    roomId: room.roomId,
    roomName: room.roomName,
    messages: room.messages,
    expiresAt: room.expiresAt,
    noOfUsers: room.users.size,
    adminId: room.adminId,
  };

  io.to(roomKey).emit("room-history", roomHistory);
}

//do stuff after a new message is sent
function handleNewMessage(newMessage: newMessageObj, io: Server) {
  const { userId, msg, roomId } = newMessage;
  const roomKey = `r-${roomId}`;
  const room = roomStore.get(roomKey);

  const msgTimestamp = getCurrentTime();
  const message: messageObj = {
    ...newMessage,
    msgTimestamp,
    type: "text",
  };

  room?.messages.push(message);

  io.to(roomKey).emit("newMessage", message);
}

function handleTerminateRoom(terminateRoomObj: any, io: Server) {
  const roomKey = `r-${terminateRoomObj.roomId}`;
  if (roomStore.has(roomKey)) {
    roomStore.delete(roomKey);
    console.log(
      `Room with id: ${terminateRoomObj.roomId} has been removed form the room store`,
    );
  }
  io.to(roomKey).emit(
    "terminate-room-successful",
    "Room Terminated Successfully",
  );
}

export { checkRoom, handleNewMessage, handleRoomJoin, handleTerminateRoom };
