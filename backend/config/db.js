import mongoose from "mongoose";

const mongo_url =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.Mongo_url;

export const connectDB = async () => {
    try {
        await mongoose.connect(mongo_url);
        console.log("MongoDB connected");
    } catch (err) {
        console.log("MongoDB connection failed", err);
        process.exit(1);
    }
};