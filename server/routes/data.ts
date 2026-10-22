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
    }

    res.json({
      tasks: data.tasks || [],
      habits: data.habits || [],
      habitLogs: data.habitLogs || [],
      transactions: data.transactions || [],
      budgets: data.budgets || [],
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

// POST /api/data/sync - Sync/save full state from frontend
router.post("/sync", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      tasks,
      habits,
      habitLogs,
      transactions,
      budgets,
      events,
      goals,
      focusSessions,
      currency
    } = req.body;

    console.log(`[CloudSync] Received state for user ${req.userId}: ${tasks?.length || 0} tasks, ${habits?.length || 0} habits, ${transactions?.length || 0} transactions`);

    const data = await UserData.findOneAndUpdate(
      { userId: req.userId },
      {
        tasks: tasks || [],
        habits: habits || [],
        habitLogs: habitLogs || [],
        transactions: transactions || [],
        budgets: budgets || [],
        events: events || [],
        goals: goals || [],
        focusSessions: focusSessions || [],
        currency: currency || "INR"
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, updatedAt: data.updatedAt });
  } catch (err: any) {
    console.error("Sync state error:", err);
    res.status(500).json({ message: "Failed to sync user state" });
  }
});

export default router;
