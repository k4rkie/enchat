import express from "express";
import path from "node:path";
import http from "node:http";
import { initSocket } from "@/chat";
import { checkRoom, createRoom } from "@/handlers/chat.handlers";
import rateLimiter from "@/middlewares/ratelimiter";

const PORT = process.env.PORT || 8080;

const app = express();

// Trust the proxy set by level 1 for: X-Forwaded-for
app.set("trust proxy", 1);

const httpServer = http.createServer(app);

initSocket(httpServer);

app.get("/", (req, res) => {
  return res.sendFile(path.join(process.cwd(), "client/index.html"));
});

app.get("/create-room", rateLimiter("room_create"), createRoom);
app.get("/join-room", rateLimiter("room_join"), checkRoom);

app.get("/r/:roomId", (req, res) => {
  return res.sendFile(path.join(process.cwd(), "client/chat.html"));
});

app.use(express.static(path.join(process.cwd(), "client")));
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/health", (req, res) => {
  return res.send("OK");
});

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
