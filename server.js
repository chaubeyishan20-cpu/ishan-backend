import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js"; 
import cropRoutes from "./routes/croproutes.js"; 

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/crops", cropRoutes);  
app.use("/api", authRoutes); 

app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
