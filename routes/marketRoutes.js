import express from "express";
import Listing from "../models/Listing.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// List all available listings (public), newest first, with farmer info
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find({ status: "available" })
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit, 10) || 100);
    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a listing (farmer only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.userRole !== "farmer") {
      return res.status(403).json({ message: "Only farmers can post listings" });
    }

    const { cropName, quantity, unit, pricePerUnit, location, contactPhone, description } = req.body;
    if (!cropName || !quantity || !pricePerUnit || !location) {
      return res.status(400).json({ message: "Crop, quantity, price and location are required" });
    }

    const listing = new Listing({
      user: req.userId,
      cropName,
      quantity: Number(quantity),
      unit,
      pricePerUnit: Number(pricePerUnit),
      location,
      contactPhone,
      description,
    });
    await listing.save();
    res.status(201).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// My listings (protected)
router.get("/mine", auth, async (req, res) => {
  try {
    const listings = await Listing.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(listings);
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

// Make an offer on a listing (buyer)
router.post("/:id/offer", auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.user.toString() === req.userId) {
      return res.status(400).json({ message: "You can't make an offer on your own listing" });
    }
    if (listing.status !== "available") {
      return res.status(400).json({ message: "This listing is no longer available for offers" });
    }

    const { quantity, proposedPrice, message } = req.body;
    if (!quantity || !proposedPrice) {
      return res.status(400).json({ message: "Quantity and proposed price are required" });
    }

    const open = listing.offers.find(
      (o) => o.buyer.toString() === req.userId && o.status === "pending"
    );
    if (open) {
      return res.status(400).json({ message: "You already have a pending offer on this listing" });
    }

    listing.offers.push({
      buyer: req.userId,
      buyerName: req.body.buyerName || "",
      quantity: Number(quantity),
      proposedPrice: Number(proposedPrice),
      message: message || "",
    });
    await listing.save();
    res.status(201).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Accept an offer (owner only) → reserved
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
    res.json(listing);
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