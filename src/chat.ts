import { Server } from "socket.io";
import {
  handleNewMessage,
  handleRoomJoin,
  handleTerminateRoom,
} from "./handlers/chat.handlers";

export function initSocket(httpServer: any) {
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("New User connected");

    // room join
    socket.on("join-room", (joinRoomObj) => {
      handleRoomJoin(joinRoomObj, socket, io);
    });

    // new message
    socket.on("newMessage", (newMessage) => {
      handleNewMessage(newMessage, io);
    });

    //terminate room
    socket.on("terminate-room", (terminateRoomObj) => {
      handleTerminateRoom(terminateRoomObj, io);
    });
  });

  return io;
}
