import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 6969;

app.use(express.static(path.join(process.cwd(), "client")));

app.get("/", (req, res) => {
  return res.sendFile(path.join(process.cwd(), "client", "index.html"));
});
app.get("/chat", (req, res) => {
  return res.sendFile(path.join(process.cwd(), "client", "chat.html"));
});

app.get("/api/health", (req, res) => {
  return res.send("OK");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
