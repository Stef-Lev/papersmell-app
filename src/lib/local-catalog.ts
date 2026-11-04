import "server-only";
import { toAccentInsensitivePattern } from "@/lib/accent-pattern";
import { SHARED_BOOK_SOURCES } from "@/lib/book-source";
import { toCatalogBook } from "@/lib/biblionet-catalog";
import { cleanIsbn, toIsbn10, toIsbn13 } from "@/lib/isbn";
import { connectDB } from "@/lib/mongodb";
import type { CatalogBook } from "@/lib/open-library";
import Book from "@/models/Book";

/** Shared catalog books matching an ISBN (any common format). */
export async function findStoredBooksByIsbn(
  isbn: string,
): Promise<CatalogBook[]> {
  const isbn13 = toIsbn13(isbn);
  const isbns = [
    ...new Set([cleanIsbn(isbn), isbn13, isbn13 && toIsbn10(isbn13)]),
  ].filter((value): value is string => Boolean(value));
  await connectDB();
  const docs = await Book.find({
    source: { $in: SHARED_BOOK_SOURCES },
    externalId: { $type: "string" },
    isbn: { $in: isbns },
  })
    .limit(5)
    .lean();
  return docs.map(toCatalogBook);
}

/** Shared catalog books whose title or author contains the text. */
export async function findStoredBooksByText(
  query: string,
): Promise<CatalogBook[]> {
  const pattern = new RegExp(toAccentInsensitivePattern(query), "i");
  await connectDB();
  const docs = await Book.find({
    source: { $in: SHARED_BOOK_SOURCES },
    externalId: { $type: "string" },
    $or: [{ title: pattern }, { authors: pattern }],
  })
    .limit(10)
    .lean();
  return docs.map(toCatalogBook);
}
