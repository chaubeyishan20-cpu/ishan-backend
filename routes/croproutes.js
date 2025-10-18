import express from "express";
import Crop from "../models/Crop.js";

const router = express.Router();

// Get all crops
router.get("/", async (req, res) => {
  try {
    const crops = await Crop.find();
    res.json(crops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching crops" });
  }
});

// Add a new crop
router.post("/", async (req, res) => {
  try {
    const crop = new Crop(req.body);
    await crop.save();
    res.status(201).json({ message: "Crop added successfully!" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to add crop" });
  }
});

export default router;
