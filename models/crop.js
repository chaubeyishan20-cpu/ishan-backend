import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  botanical_name: { type: String, required: true },
  description: { type: String, required: true },
  season: { type: String },        // optional
  soilType: { type: String },      // optional
  waterNeeds: { type: String },    // optional
  fertilizer: { type: String }     // optional
});

const Crop = mongoose.model("Crop", cropSchema);

export default Crop;
