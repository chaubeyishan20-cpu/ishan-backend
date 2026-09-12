import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import cropRoutes from "./routes/croproutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import mandiRoutes from "./routes/mandiRoutes.js";
import ChatMessage from "./models/ChatMessage.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Socket.io auth via the same JWT used by the REST API
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("unauthorized"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("chat:join", (listingId) => {
    if (typeof listingId === "string" && listingId.length <= 64) {
      socket.join(`listing:${listingId}`);
    }
  });

  socket.on("chat:leave", (listingId) => {
    socket.leave(`listing:${listingId}`);
  });

  socket.on("chat:send", async (payload) => {
    try {
      const listingId = payload?.listingId;
      const receiverId = payload?.receiverId;
      const text = typeof payload?.text === "string" ? payload.text.trim().slice(0, 1000) : "";
      if (!listingId || !receiverId || !text || !socket.userId) return;

      const message = await ChatMessage.create({
        listing: listingId,
        sender: socket.userId,
        receiver: receiverId,
        text,
      });
      io.to(`listing:${listingId}`).emit("chat:message", message);
    } catch (error) {
      console.error("chat:send error", error);
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Static files (listing photos)
app.use("/uploads", express.static(UPLOAD_DIR));

// Routes
app.use("/api/crops", cropRoutes);
app.use("/api/listings", marketRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/mandi", mandiRoutes);
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));