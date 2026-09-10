import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cropName: { type: String, required: true },
  unit: { type: String, default: "quintal" },
  quantity: { type: Number, required: true, min: 0 },
  pricePerUnit: { type: Number, required: true, min: 0 },
  location: { type: String, default: "" },
  status: { type: String, enum: ["ordered", "shipped", "delivered"], default: "ordered" },
}, { timestamps: true });

const Order = mongoose.model("Order", OrderSchema);
export default Order;