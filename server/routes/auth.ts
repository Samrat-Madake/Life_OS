import { Router, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { UserData } from "../models/UserData";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
export const getJwtSecret = (): string => process.env.JWT_SECRET || "lifeos_super_secret_jwt_key_2026";

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, encryptionSalt } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: "Name, email and password are required" });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const salt = encryptionSalt || crypto.randomBytes(16).toString("base64");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      encryptionSalt: salt
    });

    // Create user data document for newly registered user
    await UserData.create({
      userId: user._id,
      encryptedPayload: null,
      iv: null,
      version: 1,
      tasks: [],
      habits: [],
      habitLogs: [],
      transactions: [],
      budgets: [],
      events: [],
      goals: [],
      focusSessions: [],
      currency: "INR"
    });

    const token = jwt.sign({ userId: user._id.toString() }, getJwtSecret(), { expiresIn: "30d" });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        encryptionSalt: user.encryptionSalt,
        preferences: user.preferences
      }
    });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Ensure user has an encryption salt if legacy user
    if (!user.encryptionSalt) {
      user.encryptionSalt = crypto.randomBytes(16).toString("base64");
      await user.save();
    }

    const token = jwt.sign({ userId: user._id.toString() }, getJwtSecret(), { expiresIn: "30d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        encryptionSalt: user.encryptionSalt,
        preferences: user.preferences
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        encryptionSalt: user.encryptionSalt || "",
        preferences: user.preferences
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
