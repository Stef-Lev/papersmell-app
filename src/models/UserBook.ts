import mongoose, { InferSchemaType, Model } from "mongoose";
import { SHELVES, Shelf } from "@/lib/shelves";

const userBookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    status: { type: String, enum: SHELVES, default: Shelf.ToRead },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    collectionIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Collection" },
    ],
    rating: {
      type: Number,
      default: null,
      min: 0.5,
      max: 5,
      validate: {
        validator: (v: number | null) =>
          v === null || v * 2 === Math.floor(v * 2),
        message: "Rating must be in 0.5 steps",
      },
    },
    review: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    bookOverrides: {
      title: { type: String, trim: true },
      authors: { type: [{ type: String, trim: true }], default: undefined },
      isbn: { type: String, trim: true },
      pageCount: { type: Number, min: 0 },
      coverUrl: { type: String },
    },
  },
  { timestamps: true },
);

userBookSchema.index({ userId: 1, bookId: 1 }, { unique: true });
userBookSchema.index({ userId: 1, status: 1 });
userBookSchema.index({ userId: 1, finishedAt: -1 });

export type UserBookDoc = InferSchemaType<typeof userBookSchema>;

export default (mongoose.models.UserBook as Model<UserBookDoc>) ||
  mongoose.model<UserBookDoc>("UserBook", userBookSchema);
