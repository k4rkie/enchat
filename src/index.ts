import express from "express";
import path from "node:path";
import http from "node:http";
import { initSocket } from "./chat";

const app = express();
const httpServer = http.createServer(app);

initSocket(httpServer);

const PORT = process.env.PORT || 6969;

app.get("/", (req, res) => {
  return res.sendFile(path.join(process.cwd(), "client/index.html"));
});

app.get("/r/:roomId", (req, res) => {
  return res.sendFile(path.join(process.cwd(), "client/chat.html"));
});

app.use(express.static(path.join(process.cwd(), "client")));

app.get("/health", (req, res) => {
  return res.send("OK");
});

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
