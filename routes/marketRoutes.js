import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Listing from "../models/Listing.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { listingLimiter } from "../middleware/rateLimiter.js";
import { listingSchema, offerSchema, reviewSchema } from "../schemas/index.js";
import { notify } from "../utils/notify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname) || ".jpg"}`),
});

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

const upload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPhotos = upload.array("photos", 3);

const router = express.Router();

async function listingRatings(listings) {
  const ids = listings.map((l) => l._id);
  if (ids.length === 0) return new Map();
  const rows = await Review.aggregate([
    { $match: { listing: { $in: ids } } },
    { $group: { _id: "$listing", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r]));
}

function withRating(listing, ratings) {
  const l = listing.toObject ? listing.toObject() : listing;
  const r = ratings.get(listing._id.toString());
  l.rating = r ? { avg: Math.round(r.avg * 10) / 10, count: r.count } : { avg: 0, count: 0 };
  return l;
}

// List all available listings (public), newest first, with farmer info + rating
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find({ status: "available" })
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit, 10) || 100);
    const ratings = await listingRatings(listings);
    res.json(listings.map((l) => withRating(l, ratings)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a listing (farmer only) — supports up to 3 photos
router.post("/", auth, listingLimiter, (req, res) => {
  uploadPhotos(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    try {
      if (req.userRole !== "farmer") {
        return res.status(403).json({ message: "Only farmers can post listings" });
      }

      const parsed = listingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid listing" });
      }
      const { cropName, quantity, unit, pricePerUnit, location, contactPhone, description } = parsed.data;

      const photos = (req.files || []).map((f) => `/uploads/${f.filename}`);

      const listing = new Listing({
        user: req.userId,
        cropName,
        quantity,
        unit,
        pricePerUnit,
        location,
        contactPhone,
        description,
        photos,
      });
      await listing.save();
      res.status(201).json(listing);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// My listings (protected)
router.get("/mine", auth, async (req, res) => {
  try {
    const listings = await Listing.find({ user: req.userId }).sort({ createdAt: -1 });
    const ratings = await listingRatings(listings);
    res.json(listings.map((l) => withRating(l, ratings)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// My offers (protected) — every listing where this user has an offer
router.get("/myoffers", auth, async (req, res) => {
  try {
    const listings = await Listing.find({ "offers.buyer": req.userId })
      .populate("user", "name email role")
      .sort({ updatedAt: -1 });
    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reviews for a listing (public)
router.get("/:id/reviews", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Listing not found" });
    }
    const reviews = await Review.find({ listing: req.params.id })
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a review for a listing (one per author per listing, upsert)
router.post("/:id/reviews", auth, listingLimiter, validate(reviewSchema), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Listing not found" });
    }
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.user.toString() === req.userId) {
      return res.status(400).json({ message: "You can't review your own listing" });
    }
    const { rating, comment, authorName } = req.body;
    const review = await Review.findOneAndUpdate(
      { listing: listing._id, author: req.userId },
      { $set: { rating, comment, authorName } },
      { new: true, upsert: true }
    );
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Make an offer on a listing (buyer)
router.post("/:id/offer", auth, listingLimiter, validate(offerSchema), async (req, res) => {
  try {
    const id = mongoose.isValidObjectId(req.params.id) ? req.params.id : null;
    const listing = id ? await Listing.findById(id) : null;
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.user.toString() === req.userId) {
      return res.status(400).json({ message: "You can't make an offer on your own listing" });
    }
    if (listing.status !== "available") {
      return res.status(400).json({ message: "This listing is no longer available for offers" });
    }

    const { quantity, proposedPrice, message } = req.body;

    const open = listing.offers.find(
      (o) => o.buyer.toString() === req.userId && o.status === "pending"
    );
    if (open) {
      return res.status(400).json({ message: "You already have a pending offer on this listing" });
    }

    listing.offers.push({
      buyer: req.userId,
      buyerName: req.body.buyerName || "",
      quantity,
      proposedPrice,
      message,
    });
    await listing.save();
    await notify(
      listing.user,
      `New offer on your ${listing.cropName} listing: ${quantity} ${listing.unit} @ ₹${proposedPrice}/${listing.unit}`,
      "/marketplace"
    );
    res.status(201).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Accept an offer (owner only) → reserved + creates an Order
router.post("/:id/offer/:offerId/accept", auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the listing owner can accept offers" });
    }
    const offer = listing.offers.find((o) => o._id.toString() === req.params.offerId);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    if (offer.status !== "pending") {
      return res.status(400).json({ message: "Offer is no longer pending" });
    }

    offer.status = "accepted";
    listing.offers.forEach((o) => {
      if (o._id.toString() !== offer._id.toString() && o.status === "pending") o.status = "rejected";
    });
    listing.status = "reserved";
    await listing.save();

    const order = new Order({
      listing: listing._id,
      buyer: offer.buyer,
      seller: listing.user,
      cropName: listing.cropName,
      unit: listing.unit,
      quantity: offer.quantity,
      pricePerUnit: offer.proposedPrice,
      location: listing.location,
    });
    await order.save();

    await notify(
      offer.buyer,
      `Your offer on ${listing.cropName} was accepted! Order created (${offer.quantity} ${listing.unit} @ ₹${offer.proposedPrice}/${listing.unit}).`,
      "/orders"
    );
    res.json({ listing, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reject an offer (owner only)
router.post("/:id/offer/:offerId/reject", auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the listing owner can reject offers" });
    }
    const offer = listing.offers.find((o) => o._id.toString() === req.params.offerId);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    if (offer.status !== "pending") {
      return res.status(400).json({ message: "Offer is no longer pending" });
    }
    offer.status = "rejected";
    await listing.save();
    await notify(
      offer.buyer,
      `Your offer on ${listing.cropName} was rejected.`,
      "/marketplace"
    );
    res.json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Accept offer and mark listing sold
router.post("/:id/mark-sold", auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the listing owner can mark it sold" });
    }
    listing.status = "sold";
    listing.offers.forEach((o) => {
      if (o.status === "pending") o.status = "rejected";
    });
    await listing.save();

    const accepted = listing.offers.find((o) => o.status === "accepted");
    if (accepted) {
      await notify(accepted.buyer, `Your order for ${listing.cropName} is now complete.`, "/orders");
    }
    res.json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete own listing (protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this listing" });
    }
    await listing.deleteOne();
    res.json({ message: "Listing deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;