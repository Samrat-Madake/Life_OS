import mongoose, { Schema, Document } from "mongoose";

export interface IUserData extends Document {
  userId: mongoose.Types.ObjectId;
  tasks: any[];
  habits: any[];
  habitLogs: any[];
  transactions: any[];
  budgets: any[];
  subscriptions: any[];
  events: any[];
  goals: any[];
  focusSessions: any[];
  currency: string;
  encryptedPayload?: string | null;
  iv?: string | null;
  version?: number;
  updatedAt: Date;
}

const UserDataSchema = new Schema<IUserData>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    encryptedPayload: { type: String, default: null },
    iv: { type: String, default: null },
    version: { type: Number, default: 1 },
    tasks: { type: [Schema.Types.Mixed], default: [] },
    habits: { type: [Schema.Types.Mixed], default: [] },
    habitLogs: { type: [Schema.Types.Mixed], default: [] },
    transactions: { type: [Schema.Types.Mixed], default: [] },
    budgets: { type: [Schema.Types.Mixed], default: [] },
    subscriptions: { type: [Schema.Types.Mixed], default: [] },
    events: { type: [Schema.Types.Mixed], default: [] },
    goals: { type: [Schema.Types.Mixed], default: [] },
    focusSessions: { type: [Schema.Types.Mixed], default: [] },
    currency: { type: String, default: "INR" }
  },
  { timestamps: true }
);

export const UserData = mongoose.model<IUserData>("UserData", UserDataSchema);
