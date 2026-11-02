import "server-only";
import { BookSource } from "@/lib/book-source";
import { connectDB } from "@/lib/mongodb";
import type { CatalogBook } from "@/lib/open-library";
import Book, { type BookDoc } from "@/models/Book";

export function toCatalogBook(doc: BookDoc): CatalogBook {
  return {
    source: doc.source as CatalogBook["source"],
    externalId: doc.externalId ?? "",
    isbn: doc.isbn ?? undefined,
    title: doc.title,
    subtitle: doc.subtitle ?? undefined,
    authors: doc.authors,
    publisher: doc.publisher ?? undefined,
    description: doc.description ?? undefined,
    pageCount: doc.pageCount ?? 0,
    publishedDate: doc.publishedDate ?? undefined,
    categories: doc.categories,
    coverUrl: doc.coverUrl ?? undefined,
  };
}

/** A Biblionet book already saved in our own catalog, found by ISBN-13. */
export async function findStoredBiblionetBook(isbn13: string) {
  await connectDB();
  const doc = await Book.findOne({
    source: BookSource.Biblionet,
    isbn: isbn13,
  }).lean();
  return doc ? toCatalogBook(doc) : null;
}

/** Saves a normalized catalog book (Biblionet or Open Library), updating it if present. */
export async function storeCatalogBook(book: CatalogBook) {
  await connectDB();
  const { source, externalId, ...fields } = book;
  const result = await Book.findOneAndUpdate(
    { source, externalId },
    { $set: fields },
    { upsert: true, returnDocument: "after", includeResultMetadata: true },
  );
  return { created: !result.lastErrorObject?.updatedExisting };
}
