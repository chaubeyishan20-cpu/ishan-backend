import express from "express";
import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";
import Listing from "../models/Listing.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { chatSchema } from "../schemas/index.js";

const router = express.Router();

// Conversation history for a listing (participants only)
router.get("/:listingId", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.listingId)) {
      return res.status(404).json({ message: "Listing not found" });
    }
    const listing = await Listing.findById(req.params.listingId).select("user").lean();
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const messages = await ChatMessage.find({
      listing: req.params.listingId,
      $or: [
        { sender: req.userId },
        { receiver: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;