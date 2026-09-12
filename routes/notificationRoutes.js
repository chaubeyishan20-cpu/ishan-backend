import express from "express";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

// My notifications (newest first)
router.get("/", auth, async (req, res) => {
  try {
    const items = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit, 10) || 60);
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unread count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.userId, read: false });
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a notification (used for price-drop alerts, weather alerts, etc.)
router.post("/", auth, async (req, res) => {
  try {
    const { message, link, type } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });
    const item = await Notification.create({
      user: req.userId,
      type: ["info", "success", "warning"].includes(type) ? type : "info",
      message: String(message).slice(0, 500),
      link: String(link || "/").slice(0, 200),
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark one notification as read
router.patch("/read/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Not found" });
    }
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all as read
router.patch("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;