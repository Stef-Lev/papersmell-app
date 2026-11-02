import "server-only";
import { BookSource } from "@/lib/book-source";
import { toCatalogBook } from "@/lib/biblionet-catalog";
import { cleanIsbn, toIsbn13 } from "@/lib/isbn";
import { connectDB } from "@/lib/mongodb";
import type { CatalogBook } from "@/lib/open-library";
import Book from "@/models/Book";

// Manual books are private to their creator, so they are never shared in search.
const SHARED_SOURCES = [BookSource.Biblionet, BookSource.OpenLibrary];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Shared catalog books matching an ISBN (any common format). */
export async function findStoredBooksByIsbn(
  isbn: string,
): Promise<CatalogBook[]> {
  const isbns = [...new Set([cleanIsbn(isbn), toIsbn13(isbn)])].filter(
    (value): value is string => Boolean(value),
  );
  await connectDB();
  const docs = await Book.find({
    source: { $in: SHARED_SOURCES },
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
  const pattern = new RegExp(escapeRegExp(query), "i");
  await connectDB();
  const docs = await Book.find({
    source: { $in: SHARED_SOURCES },
    externalId: { $type: "string" },
    $or: [{ title: pattern }, { authors: pattern }],
  })
    .limit(10)
    .lean();
  return docs.map(toCatalogBook);
}
