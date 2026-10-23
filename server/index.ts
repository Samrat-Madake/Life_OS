import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import dataRoutes from "./routes/data";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lifeos";

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: "15mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date()
  });
});

// Connect to MongoDB & Start Server
async function start() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    app.listen(PORT, () => {
      console.log(`LifeOS API server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("LifeOS API running without DB (connect will retry)...");
    app.listen(PORT, () => {
      console.log(`LifeOS API server running on port ${PORT} (offline DB mode)`);
    });
  }
}

start();
