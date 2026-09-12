import express from "express";
import Crop from "../models/crop.js";

const router = express.Router();

// Major traded commodities — the usual "mandi board" crops. Only names present
// in the crop catalog are used, with a fallback to the first few crops by name.
const POPULAR = [
  "Rice", "Wheat", "Maize", "Onion", "Tomato", "Potato", "Chickpea", "Groundnut",
  "Mustard", "Cotton", "Soybean", "Sugarcane", "Turmeric", "Banana", "Mango", "Cabbage",
];

// Deterministic demo quote for a crop (mirrors the /crops/:name/prices series)
const demoQuote = (name) => {
  let seed = 0;
  for (let i = 0; i < name.length; i++) seed = (seed * 31 + name.charCodeAt(i)) % 100000;
  const base = 400 + (seed % 120) * 50;
  const drift = Math.sin(Date.now() / 86400000) * 5 + base * 0.006; // small day-over-day wiggle
  return {
    crop: name,
    price: Math.max(100, Math.round(base + drift)),
    unit: "quintal",
    changePct: Math.round((Math.sin(Date.now() / 43200000 + seed) * 3 + Math.cos(seed)) * 10) / 10,
  };
};

const pickPopular = async () => {
  const crops = await Crop.find({ name: { $in: POPULAR } }, { name: 1, _id: 0 });
  const present = new Set(crops.map((c) => c.name));
  const names = POPULAR.filter((n) => present.has(n));
  if (names.length >= 6) return names;
  const extras = await Crop.find({}, { name: 1, _id: 0 }).sort({ name: 1 }).limit(12);
  return extras.map((c) => c.name);
};

// Market quote ticker for the main traded crops.
// When MANDI_FEED_URL is configured (a real JSON feed returning
// [{crop, price, unit, changePct}] for these crop names), it proxies that feed;
// otherwise it returns clearly-labeled demo quotes so the UI always works.
router.get("/quotes", async (req, res) => {
  try {
    const names = await pickPopular();
    const fallback = {
      source: "demo",
      note: "Demo feed. Set MANDI_FEED_URL to proxy a real mandi price JSON feed.",
      updatedAt: new Date().toISOString(),
      quotes: names.map(demoQuote),
    };

    const feedUrl = process.env.MANDI_FEED_URL;
    if (!feedUrl) return res.json(fallback);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(feedUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) return res.json(fallback);
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.quotes;
      const byName = new Map((list || []).map((q) => [String(q.crop).toLowerCase(), q]));
      const quotes = names
        .map((n) => {
          const q = byName.get(n.toLowerCase());
          return q ? { crop: n, price: Number(q.price), unit: q.unit || "quintal", changePct: Number(q.changePct || 0) } : null;
        })
        .filter(Boolean);
      if (quotes.length === 0) return res.json(fallback);
      res.json({ source: "live", note: "Live mandi feed", updatedAt: new Date().toISOString(), quotes });
    } catch {
      return res.json(fallback);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;