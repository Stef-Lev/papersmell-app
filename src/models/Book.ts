import mongoose, { InferSchemaType, Model } from "mongoose";
import { BookSource } from "@/lib/book-source";

const bookSchema = new mongoose.Schema(
  {
    source: { type: String, enum: Object.values(BookSource), required: true },
    externalId: { type: String, trim: true },
    isbn: { type: String, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    authors: [{ type: String, trim: true }],
    publisher: { type: String, trim: true },
    description: { type: String },
    coverUrl: { type: String },
    pageCount: { type: Number, min: 0, default: 0 },
    publishedDate: { type: String },
    categories: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Partial so manual books (no externalId) are not constrained
bookSchema.index(
  { source: 1, externalId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalId: { $type: "string" } },
  },
);

export type BookDoc = InferSchemaType<typeof bookSchema>;

export default (mongoose.models.Book as Model<BookDoc>) ||
  mongoose.model<BookDoc>("Book", bookSchema);
