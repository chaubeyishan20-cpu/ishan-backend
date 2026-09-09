import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  buyerName: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  proposedPrice: { type: Number, required: true, min: 0 },
  message: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
}, { timestamps: true });

const ListingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cropName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ["quintal", "kg", "tonne", "bag"], default: "quintal" },
  pricePerUnit: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true },
  contactPhone: { type: String, trim: true, default: "" },
  description: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["available", "reserved", "sold"], default: "available" },
  offers: { type: [OfferSchema], default: [] },
}, { timestamps: true });

const Listing = mongoose.model("Listing", ListingSchema);
export default Listing;