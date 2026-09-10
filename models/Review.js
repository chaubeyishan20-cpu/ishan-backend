import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, default: "" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "", trim: true },
}, { timestamps: true });

const Review = mongoose.model("Review", ReviewSchema);
export default Review;