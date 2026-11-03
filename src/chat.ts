import { Server } from "socket.io";
import {
  handleNewMessage,
  handleRoomJoin,
  handleTerminateRoom,
  handleDisconnecting,
} from "@/handlers/chat.handlers";
import { verifyRoomAccessToken } from "@/auth/access.helper";

const ROOM_ID_PATTERN = /^[A-Za-z0-9]{8}$/;

export function initSocket(httpServer: any) {
  const io = new Server(httpServer);

  io.use(async (socket, next) => {
    const roomId = socket.handshake.auth?.roomId;
    const token = socket.handshake.auth?.token;

    if (
      typeof roomId !== "string" ||
      !ROOM_ID_PATTERN.test(roomId) ||
      typeof token !== "string"
    ) {
      return next(new Error("unauthorized"));
    }

    let claims;

    try {
      claims = await verifyRoomAccessToken(token);
    } catch {
      return next(new Error("unauthorized"));
    }

    if (!claims || claims.roomId !== roomId) {
      return next(new Error("unauthorized"));
    }

    socket.data.userId = claims.userId;
    socket.data.roomId = claims.roomId;
    socket.data.action = claims.action;

    next();
  });

  io.on("connection", (socket) => {
    // room join
    socket.on("join-room", (joinRoomObj) => {
      handleRoomJoin(joinRoomObj, socket, io);
    });

    // new message
    socket.on("newMessage", (newMessage) => {
      handleNewMessage(newMessage, socket, io);
    });

    //terminate room
    socket.on("terminate-room", (terminateRoomObj) => {
      handleTerminateRoom(terminateRoomObj, io);
    });

    socket.on("disconnecting", () => {
      handleDisconnecting(socket, io);
    });
  });

  return io;
}
