import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Crop from "./models/crop.js";

dotenv.config();

const cropsData = JSON.parse(fs.readFileSync("./crops.json", "utf-8"));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected ✅");

    await Crop.deleteMany({});

    await Crop.insertMany(cropsData);
    console.log("Crops seeded successfully 🌾");

    mongoose.disconnect();
  })
  .catch((err) => console.error("MongoDB connection error ❌", err));
