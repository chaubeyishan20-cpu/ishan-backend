import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  name: String,
  botanical_name: String,
  description: String,
  season: String,
  soilType: String,
  waterNeeds: String,
  fertilizer: String,
});

const Crop = mongoose.model("Crop", cropSchema, "Crops");

export default Crop;
