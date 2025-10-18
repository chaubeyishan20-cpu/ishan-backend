import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Crop from "./models/crop.js";

dotenv.config();

// Read crops.json
const cropsPath = path.resolve("./crops.json");
const cropsData = JSON.parse(fs.readFileSync(cropsPath, "utf-8"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Remove existing crops (optional)
    await Crop.deleteMany({});

    // Insert crops
    await Crop.insertMany(cropsData);

    console.log("🌱 Database seeded with crops!");
    mongoose.disconnect();
  })
  .catch((err) => console.error(err));
