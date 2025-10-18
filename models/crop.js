import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  botanical_name: { type: String, required: true },
  description: { type: String, required: true },
  season: { type: String, required: true },
  soilType: { type: String, required: true },
  waterNeeds: { type: String, required: true }, // e.g., Low/Medium/High
  fertilizer: { type: String, required: true },
  minTemp: { type: Number, required: true }, // minimum suitable temperature
  maxTemp: { type: Number, required: true }, // maximum suitable temperature
});


const Crop = mongoose.model("Crop", cropSchema);

export default Crop;
