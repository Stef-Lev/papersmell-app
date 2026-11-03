import mongoose from "mongoose";
import {
  getSessionUserId,
  isDuplicateKeyError,
  isObjectIdList,
  jsonError,
  ownsCollections,
  toCollectionJson,
  unauthorized,
} from "@/lib/api";
import { toDateOnly } from "@/lib/dates";
import { connectDB } from "@/lib/mongodb";
import type { NewBook } from "@/lib/open-library";
import { Shelf, isShelf } from "@/lib/shelves";
import { BookSource } from "@/lib/book-source";
import { fetchBiblionetBook } from "@/lib/biblionet";
import { toGreekIsbn13, toIsbn13 } from "@/lib/isbn";
import { storeCatalogBook } from "@/lib/biblionet-catalog";
import Book from "@/models/Book";
import Collection from "@/models/Collection";
import UserBook from "@/models/UserBook";

function isNewBook(value: unknown): value is NewBook {
  if (!value || typeof value !== "object") return false;
  const book = value as Record<string, unknown>;
  return (
    (book.source === BookSource.OpenLibrary ||
      book.source === BookSource.Biblionet ||
      book.source === BookSource.Manual) &&
    typeof book.title === "string" &&
    book.title.trim().length > 0 &&
    book.title.length <= 300 &&
    (book.authors === undefined ||
      (Array.isArray(book.authors) &&
        book.authors.length <= 20 &&
        book.authors.every(
          (author) => typeof author === "string" && author.length <= 200,
        ))) &&
    (book.categories === undefined ||
      (Array.isArray(book.categories) &&
        book.categories.length <= 20 &&
        book.categories.every(
          (category) => typeof category === "string" && category.length <= 100,
        ))) &&
    (book.pageCount === undefined ||
      (typeof book.pageCount === "number" &&
        Number.isInteger(book.pageCount) &&
        book.pageCount >= 0)) &&
    (book.isbn === undefined || typeof book.isbn === "string") &&
    (book.externalId === undefined || typeof book.externalId === "string") &&
    (book.publishedDate === undefined ||
      (typeof book.publishedDate === "string" &&
        book.publishedDate.length <= 40)) &&
    (book.coverUrl === undefined || typeof book.coverUrl === "string")
  );
}

function safeUrl(value: unknown) {
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

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  await connectDB();
  const [entries, collections] = await Promise.all([
    UserBook.find({ userId }).populate("bookId").sort({ updatedAt: -1 }).lean(),
    Collection.find({ userId }).sort({ name: 1 }).lean(),
  ]);

  return Response.json({
    entries: entries.map((entry) => {
      const book = entry.bookId as unknown as Record<string, unknown>;
      const overrides = (entry as unknown as Record<string, unknown>).bookOverrides as Record<string, unknown> | undefined;
      // Mongoose stores an empty authors array when nothing was overridden; it must not hide the book's authors.
      const authorOverride =
        Array.isArray(overrides?.authors) && overrides.authors.length
          ? overrides.authors
          : undefined;
      return {
        id: entry._id.toString(),
        status: entry.status,
        rating: entry.rating,
        review: entry.review ?? "",
        startedAt: entry.startedAt ? toDateOnly(entry.startedAt) : "",
        finishedAt: entry.finishedAt ? toDateOnly(entry.finishedAt) : "",
        collectionIds: entry.collectionIds.map((id) => id.toString()),
        createdAt: entry.createdAt.toISOString(),
        book: {
          id: String(book._id),
          source: book.source,
          externalId: book.externalId,
          title: overrides?.title || book.title,
          authors: authorOverride || book.authors,
          isbn: overrides?.isbn || book.isbn,
          pageCount: overrides?.pageCount ?? book.pageCount,
          categories: book.categories,
          coverUrl: overrides?.coverUrl || book.coverUrl,
          publishedDate: book.publishedDate,
        },
        bookOverrides: overrides ? { ...overrides, authors: authorOverride } : {},
      };
    }),
    collections: collections.map(toCollectionJson),
  });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body: unknown = await request.json();
  if (!body || typeof body !== "object") {
    return jsonError("Invalid book details.", 400);
  }
  const { book, status, collectionIds } = body as Record<string, unknown>;
  if (!isNewBook(book)) {
    return jsonError("A valid book title is required.", 400);
  }
  const selectedStatus = status === undefined ? Shelf.ToRead : status;
  if (!isShelf(selectedStatus)) {
    return jsonError("Select a valid shelf.", 400);
  }
  if (collectionIds !== undefined && !isObjectIdList(collectionIds)) {
    return jsonError("Select valid collections.", 400);
  }
  if (book.coverUrl && !safeUrl(book.coverUrl)) {
    return jsonError("Enter a valid HTTP or HTTPS cover URL.", 400);
  }

  await connectDB();
  const ownedCollections = collectionIds ?? [];
  if (!(await ownsCollections(ownedCollections, userId))) {
    return jsonError("One or more collections could not be found.", 400);
  }

  // isNewBook has already validated these fields' types
  const bookFields = {
    isbn: (book.isbn && toIsbn13(book.isbn)) || book.isbn?.slice(0, 32),
    title: book.title.trim(),
    authors: book.authors ?? [],
    pageCount: book.pageCount ?? 0,
    publishedDate: book.publishedDate,
    categories: book.categories ?? [],
    coverUrl: safeUrl(book.coverUrl),
  };
  let catalogBookId: mongoose.Types.ObjectId;
  if (book.source === BookSource.Biblionet) {
    // Never trust client fields for Biblionet books: use our stored copy or fetch it.
    if (typeof book.externalId !== "string" || !/^\d{1,20}$/.test(book.externalId)) {
      return jsonError("The catalog result is invalid.", 400);
    }
    const filter = { source: BookSource.Biblionet, externalId: book.externalId };
    let catalogBook = await Book.findOne(filter);
    if (!catalogBook) {
      let fetched;
      try {
        // Looking up by ISBN first reuses the search's cached Biblionet response.
        const greekIsbn = book.isbn ? toGreekIsbn13(book.isbn) : null;
        if (greekIsbn) {
          fetched = await fetchBiblionetBook({ isbn: greekIsbn });
          if (fetched?.externalId !== book.externalId) fetched = null;
        }
        fetched ??= await fetchBiblionetBook({ titleId: book.externalId });
      } catch (error) {
        console.error("Biblionet lookup failed:", error);
        return jsonError("Biblionet is unavailable. Please try again.", 502);
      }
      if (!fetched) return jsonError("The catalog result is invalid.", 400);
      await storeCatalogBook(fetched);
      catalogBook = await Book.findOne(filter);
    }
    if (!catalogBook) {
      throw new Error("Biblionet book could not be saved.");
    }
    catalogBookId = catalogBook._id;
  } else if (book.source === BookSource.OpenLibrary) {
    if (typeof book.externalId !== "string" || book.externalId.length > 100) {
      return jsonError("The catalog result is invalid.", 400);
    }
    const filter = {
      source: BookSource.OpenLibrary,
      externalId: book.externalId,
    };
    let catalogBook = await Book.findOne(filter);
    if (!catalogBook) {
      // The same edition may already be saved from another source; reuse it.
      const isbn13 = bookFields.isbn ? toIsbn13(bookFields.isbn) : null;
      if (isbn13) {
        catalogBook = await Book.findOne({
          source: { $in: [BookSource.Biblionet, BookSource.OpenLibrary] },
          externalId: { $type: "string" },
          isbn: isbn13,
        });
      }
    }
    if (!catalogBook) {
      try {
        catalogBook = await Book.create({ ...filter, ...bookFields });
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        catalogBook = await Book.findOne(filter);
      }
    }
    if (!catalogBook) {
      throw new Error("Open Library book could not be saved.");
    }
    catalogBookId = catalogBook._id;
  } else {
    const catalogBook = await Book.create({
      source: BookSource.Manual,
      createdBy: userId,
      ...bookFields,
    });
    catalogBookId = catalogBook._id;
  }

  try {
    const entry = await UserBook.create({
      userId,
      bookId: catalogBookId,
      status: selectedStatus,
      startedAt: selectedStatus === Shelf.CurrentlyReading ? new Date() : null,
      finishedAt: selectedStatus === Shelf.Read ? new Date() : null,
      collectionIds: ownedCollections,
    });
    return Response.json({ id: entry._id.toString() }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return jsonError("This book is already in your library.", 409);
    }
    throw error;
  }
}
