import type { Request, Response } from "express";
import type { Server, Socket } from "socket.io";
import { getCurrentTime } from "../utils/utils";

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
};

type joinRoomObj = {
  roomId: string;
  userId: string;
  userName: string;
};

type Room = {
  roomId: string;
  messages: messageObj[];
  expiresAt: number;
  users: Set<string>;
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
      messages: [],
      expiresAt: Date.now() + 30 * 60 * 1000,
      users: new Set([joinRoomObj.userId]),
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
  }

  const room = roomStore.get(roomKey);
  if (room) {
    console.log(roomStore);
    room!.users.add(joinRoomObj.userId);
  }

  const roomHistory = {
    messages: room?.messages,
    expiresAt: room?.expiresAt,
  };

  socket.emit("room-history", roomHistory);
}

//do stuff after a new message is sent
function handleNewMessage(newMessage: newMessageObj, io: Server) {
  const { userId, msg, roomId } = newMessage;
  const roomKey = `r-${roomId}`;
  const room = roomStore.get(roomKey);

  const msgTimestamp = getCurrentTime();
  const message = { ...newMessage, msgTimestamp };

  room?.messages.push(message);

  io.to(roomKey).emit("newMessage", message);
}

export { checkRoom, handleNewMessage, handleRoomJoin };
