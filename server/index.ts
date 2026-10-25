import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import dataRoutes from "./routes/data";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lifeos";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173"
];

if (process.env.CLIENT_ORIGIN) {
  const configured = process.env.CLIENT_ORIGIN.split(",").map(o => o.trim()).filter(Boolean);
  allowedOrigins.push(...configured);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. health checks, curl, cron pings)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.includes(origin);
    const isVercelDomain = /^https:\/\/[a-z0-9\-]+\.vercel\.app$/i.test(origin);
    const isDev = process.env.NODE_ENV !== "production";

    if (isExplicitlyAllowed || isVercelDomain || isDev) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "15mb" }));

// Root welcome & health routes
app.get("/", (_req, res) => {
  res.json({
    name: "LifeOS Cloud API",
    status: "active",
    health: "/api/health",
    timestamp: new Date()
  });
});

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
