import express from "express";
import Crop from "../models/crop.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const name = req.query.name?.toLowerCase();
    const crop = await Crop.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    res.json(crop);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
