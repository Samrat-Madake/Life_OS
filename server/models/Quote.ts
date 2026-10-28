import mongoose, { Schema, Document } from "mongoose";

export type QuoteCardStyle =
  | "terracotta-badge"
  | "dotted-circle"
  | "mint-banner"
  | "lavender-bubble"
  | "dark-circle"
  | "peach-card"
  | "dotted-border"
  | "pill-frame"
  | "ribbon-tag"
  | "notched-banner"
  | "minimal-ring";

export interface IQuote extends Document {
  text: string;
  author: string;
  category: string;
  cardStyle: QuoteCardStyle;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600
    },
    author: {
      type: String,
      default: "Anonymous",
      trim: true,
      maxlength: 120
    },
    category: {
      type: String,
      default: "Inspiration",
      trim: true
    },
    cardStyle: {
      type: String,
      enum: [
        "terracotta-badge",
        "dotted-circle",
        "mint-banner",
        "lavender-bubble",
        "dark-circle",
        "peach-card",
        "dotted-border",
        "pill-frame",
        "ribbon-tag",
        "notched-banner",
        "minimal-ring"
      ],
      default: "terracotta-badge"
    }
  },
  { timestamps: true }
);

QuoteSchema.index({ createdAt: -1 });
QuoteSchema.index({ category: 1 });

export const Quote = mongoose.model<IQuote>("Quote", QuoteSchema);
