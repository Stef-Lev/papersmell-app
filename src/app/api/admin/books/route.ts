import mongoose from "mongoose";
import { isAdminSession } from "@/lib/admin";
import { getSessionUserId, jsonError } from "@/lib/api";
import { isBookInput, safeUrl, toBookFields } from "@/lib/book-input";
import { BookSource, SHARED_BOOK_SOURCES } from "@/lib/book-source";
import { toIsbn13 } from "@/lib/isbn";
import { connectDB } from "@/lib/mongodb";
import Book from "@/models/Book";

/** Adds a hand-entered book to the shared catalog, visible to every user in search. */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId || !(await isAdminSession())) return jsonError("Not found.", 404);

  const body: unknown = await request.json().catch(() => null);
  if (!isBookInput(body)) {
    return jsonError("A valid book title is required.", 400);
  }
  if (body.coverUrl && !safeUrl(body.coverUrl)) {
    return jsonError("Enter a valid HTTP or HTTPS cover URL.", 400);
  }

  const fields = toBookFields(body);
  await connectDB();
  const isbn13 = fields.isbn ? toIsbn13(fields.isbn) : null;
  if (
    isbn13 &&
    (await Book.exists({
      source: { $in: SHARED_BOOK_SOURCES },
      externalId: { $type: "string" },
      isbn: isbn13,
    }))
  ) {
    return jsonError("A book with this ISBN is already in our catalog.", 409);
  }

  const book = await Book.create({
    source: BookSource.PaperSmell,
    // Shared books need an externalId so search results can be added to libraries.
    externalId: new mongoose.Types.ObjectId().toHexString(),
    createdBy: userId,
    ...fields,
  });
  return Response.json({ id: book._id.toString() }, { status: 201 });
}
