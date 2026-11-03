import mongoose, { InferSchemaType, Model } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: {
      data: Buffer,
      contentType: String,
    },
    avatarVersion: { type: String },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export default (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema);
