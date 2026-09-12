import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.log("Usage: node scripts/seed-verified.mjs <email...>  (e.g. ravi@farm.test)");
  process.exit(0);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await User.updateMany({ email: { $in: emails } }, { $set: { verified: true } });
  console.log(`Verified ${res.modifiedCount} user(s) of ${res.matchedCount} matched`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});