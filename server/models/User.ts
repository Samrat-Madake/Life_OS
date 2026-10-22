import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  preferences: {
    theme: "dark" | "light";
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    preferences: {
      theme: { type: String, enum: ["dark", "light"], default: "dark" },
      currency: { type: String, default: "INR" }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
