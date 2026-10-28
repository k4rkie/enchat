import { Server } from "socket.io";
import {
  handleNewMessage,
  handleRoomJoin,
  handleTerminateRoom,
  handleDisconnect,
} from "@/handlers/chat.handlers";

export function initSocket(httpServer: any) {
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    // room join
    socket.on("join-room", (joinRoomObj) => {
      console.log("Socket connected", socket.id);
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

    socket.on("disconnect", () => {
      console.log("Socket disconnected", socket.id);
      handleDisconnect(socket, io);
    });
  });

  return io;
}
