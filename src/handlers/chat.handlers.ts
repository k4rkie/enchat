import type { Server, Socket } from "socket.io";
import { getCurrentTime } from "../utils/utils";

type newMessageObj = {
  userId: string;
  msg: string;
  roomId: string;
};

type messageObj = {
  userId: string;
  msg: string;
  roomId: string;
  msgTimestamp: string;
};

type joinRoomObj = {
  roomId: string;
  userId: string;
};

type Room = {
  roomId: string;
  messages: messageObj[];
  createdAt: number;
  users: Set<string>;
};

const roomStore = new Map<string, Room>();

//do stuff after a user joins/creates a new room
function handleRoomJoin(joinRoomObj: joinRoomObj, socket: Socket) {
  const roomKey = `r-${joinRoomObj.roomId}`;
  socket.join(roomKey);

  if (!roomStore.has(`r-${joinRoomObj.roomId}`)) {
    roomStore.set(`r-${joinRoomObj.roomId}`, {
      roomId: joinRoomObj.roomId,
      messages: [],
      createdAt: Date.now(),
      users: new Set([joinRoomObj.userId]),
    });
  }
  const room = roomStore.get(roomKey);
  room!.users.add(joinRoomObj.userId);

  socket.emit("room-history", room?.messages);
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

export { handleNewMessage, handleRoomJoin };
