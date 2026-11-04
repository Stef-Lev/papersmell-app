import { BookSource } from "@/lib/book-source";
import { toIsbn13 } from "@/lib/isbn";
import type { NewBook } from "@/lib/open-library";

/** Book details typed in by hand, before a source is attached. */
export type BookInput = Omit<NewBook, "source" | "externalId">;

export function safeUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function isStringList(value: unknown, maxItems: number, maxLength: number) {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => typeof item === "string" && item.length <= maxLength)
  );
}

export function isBookInput(value: unknown): value is BookInput {
  if (!value || typeof value !== "object") return false;
  const book = value as Record<string, unknown>;
  return (
    typeof book.title === "string" &&
    book.title.trim().length > 0 &&
    book.title.length <= 300 &&
    (book.authors === undefined || isStringList(book.authors, 20, 200)) &&
    (book.categories === undefined || isStringList(book.categories, 20, 100)) &&
    (book.pageCount === undefined ||
      (typeof book.pageCount === "number" &&
        Number.isInteger(book.pageCount) &&
        book.pageCount >= 0)) &&
    (book.isbn === undefined || typeof book.isbn === "string") &&
    (book.publishedDate === undefined ||
      (typeof book.publishedDate === "string" &&
        book.publishedDate.length <= 40)) &&
    (book.coverUrl === undefined || typeof book.coverUrl === "string")
  );
}

export function isNewBook(value: unknown): value is NewBook {
  if (!isBookInput(value)) return false;
  const book = value as unknown as Record<string, unknown>;
  return (
    (book.source === BookSource.OpenLibrary ||
      book.source === BookSource.Biblionet ||
      book.source === BookSource.PaperSmell ||
      book.source === BookSource.Manual) &&
    (book.externalId === undefined || typeof book.externalId === "string")
  );
}

/** Normalized fields to store on a Book; the input must already be validated. */
export function toBookFields(book: BookInput) {
  return {
    isbn: (book.isbn && toIsbn13(book.isbn)) || book.isbn?.slice(0, 32),
    title: book.title.trim(),
    authors: book.authors ?? [],
    pageCount: book.pageCount ?? 0,
    publishedDate: book.publishedDate,
    categories: book.categories ?? [],
    coverUrl: safeUrl(book.coverUrl),
  };
}
