import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Quote, type QuoteCardStyle } from "../models/Quote";

const router = Router();

const DEFAULT_SEEDS: Array<{
  text: string;
  author: string;
  category: string;
  cardStyle: QuoteCardStyle;
}> = [
  {
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
    category: "Mindset",
    cardStyle: "terracotta-badge"
  },
  {
    text: "Simplicity is prerequisite for reliability. Keep systems clean and focused.",
    author: "Edsger W. Dijkstra",
    category: "Wisdom",
    cardStyle: "dotted-circle"
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
    category: "Discipline",
    cardStyle: "mint-banner"
  },
  {
    text: "The secret of getting ahead is getting started. Break complex tasks into small steps.",
    author: "Mark Twain",
    category: "Motivation",
    cardStyle: "lavender-bubble"
  },
  {
    text: "Stay hungry. Stay foolish. Never lose your appetite for wonder.",
    author: "Steve Jobs",
    category: "Inspiration",
    cardStyle: "dark-circle"
  },
  {
    text: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
    category: "Philosophy",
    cardStyle: "peach-card"
  },
  {
    text: "Focus on being productive instead of busy. Deep work creates lasting leverage.",
    author: "Tim Ferriss",
    category: "Focus",
    cardStyle: "dotted-border"
  },
  {
    text: "Done is better than perfect. Consistent execution always compounds.",
    author: "Sheryl Sandberg",
    category: "Discipline",
    cardStyle: "pill-frame"
  },
  {
    text: "Small deeds done are infinitely better than great deeds planned.",
    author: "Peter Marshall",
    category: "Motivation",
    cardStyle: "ribbon-tag"
  },
  {
    text: "Action is the foundational key to all success and breakthrough momentum.",
    author: "Pablo Picasso",
    category: "Inspiration",
    cardStyle: "notched-banner"
  },
  {
    text: "Silence and quiet reflection are sources of invincible strength.",
    author: "Lao Tzu",
    category: "Mindset",
    cardStyle: "minimal-ring"
  }
];

// In-memory fallback if MongoDB is not connected
let memoryQuotes = DEFAULT_SEEDS.map((s, idx) => ({
  _id: `seed-${idx + 1}`,
  ...s,
  createdAt: new Date(Date.now() - (11 - idx) * 3600000),
  updatedAt: new Date(Date.now() - (11 - idx) * 3600000)
}));

// Helper to check DB status
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Seed default quotes if DB is empty
async function ensureDbSeeds() {
  if (!isDbConnected()) return;
  try {
    const count = await Quote.countDocuments();
    if (count === 0) {
      await Quote.insertMany(DEFAULT_SEEDS);
      console.log("[Quotes] Seeded initial quotes with reference card styles.");
    }
  } catch (err) {
    console.error("[Quotes] Error checking seed quotes:", err);
  }
}

// GET /api/quotes - Fetch all quotes with optional filter & search
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    if (isDbConnected()) {
      await ensureDbSeeds();
      const filter: any = {};
      if (category && typeof category === "string" && category !== "All") {
        filter.category = new RegExp(`^${category}$`, "i");
      }
      if (search && typeof search === "string" && search.trim()) {
        const query = search.trim();
        filter.$or = [
          { text: { $regex: query, $options: "i" } },
          { author: { $regex: query, $options: "i" } }
        ];
      }

      const quotes = await Quote.find(filter).sort({ createdAt: -1 }).limit(100);
      res.json(quotes);
      return;
    }

    // In-memory fallback
    let result = [...memoryQuotes];
    if (category && typeof category === "string" && category !== "All") {
      result = result.filter(q => q.category.toLowerCase() === category.toLowerCase());
    }
    if (search && typeof search === "string" && search.trim()) {
      const qLower = search.trim().toLowerCase();
      result = result.filter(q => q.text.toLowerCase().includes(qLower) || q.author.toLowerCase().includes(qLower));
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(result);
  } catch (err: any) {
    console.error("Fetch quotes error:", err);
    res.status(500).json({ message: "Failed to fetch quotes" });
  }
});

// POST /api/quotes - Add a new quote (open to any user without mutating User model)
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, author, category, cardStyle } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ message: "Quote text is required" });
      return;
    }

    const cleanText = text.trim();
    const cleanAuthor = author && typeof author === "string" && author.trim() ? author.trim() : "Anonymous";
    const cleanCategory = category && typeof category === "string" && category.trim() ? category.trim() : "Inspiration";
    const cleanStyle: QuoteCardStyle = cardStyle || "terracotta-badge";

    if (isDbConnected()) {
      const newQuote = await Quote.create({
        text: cleanText,
        author: cleanAuthor,
        category: cleanCategory,
        cardStyle: cleanStyle
      });
      res.status(201).json(newQuote);
      return;
    }

    // In-memory fallback
    const newQuote = {
      _id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: cleanText,
      author: cleanAuthor,
      category: cleanCategory,
      cardStyle: cleanStyle,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryQuotes.unshift(newQuote);
    res.status(201).json(newQuote);
  } catch (err: any) {
    console.error("Create quote error:", err);
    res.status(500).json({ message: "Failed to create quote" });
  }
});

// DELETE /api/quotes/:id - Optional delete
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (mongoose.isValidObjectId(id)) {
        await Quote.findByIdAndDelete(id);
      } else {
        await Quote.deleteOne({ _id: id });
      }
      res.json({ success: true });
      return;
    }

    memoryQuotes = memoryQuotes.filter(q => q._id !== id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Delete quote error:", err);
    res.status(500).json({ message: "Failed to delete quote" });
  }
});

export default router;
