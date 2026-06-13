const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true
  }
});

const Message = require("./models/message");
const Notification = require("./models/notification");
const { _conversationIdFor } = require("./controllers/chatController");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";



app.use(cors());

app.use(express.json());




app.use("/api/auth", require("./routes/authRoutes"));



app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/match", require("./routes/matchRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/requests", require("./routes/swapRequestRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/hackathons", require("./routes/hackathonRoutes"));

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbLabels = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  res.json({
    ok: dbState === 1,
    db: dbLabels[dbState] || "unknown"
  });
});

// MongoDB Connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error(
    "MONGO_URI is missing. Add your MongoDB connection string to server/.env (see .env.example)."
  );
} else {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB connection failed:", err.message));
}

// Server
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;
    if (!token) return next(new Error("No token"));
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (e) {
    next(new Error("Unauthorized"));
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);

  socket.on("chat:send", async ({ to, text }) => {
    try {
      const trimmed = String(text || "").trim();
      if (!to || !trimmed) return;

      const conversationId = _conversationIdFor(socket.userId, to);
      const msg = await Message.create({
        conversationId,
        from: socket.userId,
        to,
        text: trimmed
      });

      io.to(`user:${socket.userId}`).emit("chat:new", msg);
      io.to(`user:${to}`).emit("chat:new", msg);

      const notif = await Notification.create({
        user: to,
        type: "message",
        title: "New message",
        body: trimmed.slice(0, 140),
        data: { from: socket.userId, conversationId }
      });
      io.to(`user:${to}`).emit("notification:new", notif);
    } catch (e) {
      // swallow per-message errors
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});