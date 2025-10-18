import mongoose from "mongoose";

const CropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  botanical_name: { type: String, required: true },
  description: { type: String, required: true },
  season: { type: String, required: true },
  soilType: { type: String, required: true },
  waterNeeds: { type: String, required: true },
  fertilizer: { type: String, required: true },
}, { timestamps: true });

const Crop = mongoose.model("Crop", CropSchema);
export default Crop;
