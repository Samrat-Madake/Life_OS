import { Router, Response } from "express";
import { UserData } from "../models/UserData";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/data/state - Fetch cloud state for the logged-in user
router.get("/state", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let data = await UserData.findOne({ userId: req.userId });
    if (!data) {
      data = await UserData.create({
        userId: req.userId,
        encryptedPayload: null,
        iv: null,
        version: 1,
        tasks: [],
        habits: [],
        habitLogs: [],
        transactions: [],
        budgets: [],
        subscriptions: [],
        events: [],
        goals: [],
        focusSessions: [],
        currency: "INR"
      });
    }

    // If client has an encrypted vault, return the ciphertext & IV directly
    if (data.encryptedPayload && data.iv) {
      res.json({
        encryptedPayload: data.encryptedPayload,
        iv: data.iv,
        version: data.version || 1
      });
      return;
    }

    // Otherwise return legacy unencrypted state (for migration)
    res.json({
      tasks: data.tasks || [],
      habits: data.habits || [],
      habitLogs: data.habitLogs || [],
      transactions: data.transactions || [],
      budgets: data.budgets || [],
      subscriptions: (data as any).subscriptions || [],
      events: data.events || [],
      goals: data.goals || [],
      focusSessions: data.focusSessions || [],
      currency: data.currency || "INR"
    });
  } catch (err: any) {
    console.error("Fetch state error:", err);
    res.status(500).json({ message: "Failed to fetch user state" });
  }
});

// POST /api/data/sync - Sync/save state from frontend
router.post("/sync", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { encryptedPayload, iv, version } = req.body;

    // Encrypted Vault Payload (Zero-Knowledge: MongoDB and server never see plaintext)
    if (encryptedPayload && iv) {
      const data = await UserData.findOneAndUpdate(
        { userId: req.userId },
        {
          $set: {
            userId: req.userId,
            encryptedPayload,
            iv,
            version: version || 1,
            // Purge plaintext arrays from MongoDB
            tasks: [],
            habits: [],
            habitLogs: [],
            transactions: [],
            budgets: [],
            subscriptions: [],
            events: [],
            goals: [],
            focusSessions: []
          }
        },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
      );

      res.json({ success: true, updatedAt: data?.updatedAt || new Date() });
      return;
    }

    // Legacy unencrypted sync fallback
    const {
      tasks,
      habits,
      habitLogs,
      transactions,
      budgets,
      subscriptions,
      events,
      goals,
      focusSessions,
      currency
    } = req.body;

    const data = await UserData.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          userId: req.userId,
          tasks: tasks || [],
          habits: habits || [],
          habitLogs: habitLogs || [],
          transactions: transactions || [],
          budgets: budgets || [],
          subscriptions: subscriptions || [],
          events: events || [],
          goals: goals || [],
          focusSessions: focusSessions || [],
          currency: currency || "INR"
        }
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, updatedAt: data?.updatedAt || new Date() });
  } catch (err: any) {
    console.error("Sync state error:", err);
    res.status(500).json({ message: "Failed to sync user state" });
  }
});

export default router;
