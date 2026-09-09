import express from "express";
import Crop from "../models/crop.js";

const router = express.Router();

// List all crops
router.get("/", async (req, res) => {
  try {
    const crops = await Crop.find({}, { _id: 0, __v: 0 }).sort({ name: 1 });
    res.json(crops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search a single crop by name
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

// Deterministic ~12-week price series for a crop (demo data, generated from name)
router.get("/:name/prices", async (req, res) => {
  try {
    const name = req.params.name;
    const crop = await Crop.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (!crop) return res.status(404).json({ message: "Crop not found" });

    let seed = 0;
    for (let i = 0; i < name.length; i++) seed = (seed * 31 + name.charCodeAt(i)) % 100000;
    const base = 400 + (seed % 120) * 50; // 400–6350
    const rand = (i) => {
      let x = Math.sin(seed * 13 + i * 71) * 10000;
      return x - Math.floor(x); // 0..1 deterministic
    };

    const series = [];
    const weeks = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      weeks.push(d.toISOString().slice(0, 10));
    }
    for (let i = 0; i < 12; i++) {
      const drift = Math.sin(i / 2) * 4 + (rand(i) - 0.5) * 10;
      series.push({ week: weeks[i], price: Math.max(100, Math.round(base * (1 + drift / 100))) });
    }

    res.json({ crop: crop.name, unit: "quintal", basePrice: base, series });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;