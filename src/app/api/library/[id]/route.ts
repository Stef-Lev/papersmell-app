import mongoose from "mongoose";
import {
  getSessionUserId,
  isObjectIdList,
  jsonError,
  ownsCollections,
  unauthorized,
} from "@/lib/api";
import { toDateOnly } from "@/lib/dates";
import { connectDB } from "@/lib/mongodb";
import { Shelf, isShelf } from "@/lib/shelves";
import { isValidCurrentPage } from "@/lib/book-progress";
import Book from "@/models/Book";
import UserBook from "@/models/UserBook";

type RouteContext = { params: Promise<{ id: string }> };

function parseDate(value: unknown) {
  if (value === "" || value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || toDateOnly(date) !== value
    ? undefined
    : date;
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Book not found.", 404);
  }

  const body: unknown = await request.json();
  if (!body || typeof body !== "object") {
    return jsonError("Invalid book details.", 400);
  }
  const updates = body as Record<string, unknown>;
  const set: Record<string, unknown> = {};
  if (updates.status !== undefined) {
    if (!isShelf(updates.status)) {
      return jsonError("Select a valid shelf.", 400);
    }
    set.status = updates.status;
  }
  if (updates.currentPage !== undefined) {
    if (!isValidCurrentPage(updates.currentPage)) {
      return jsonError("Current page must be a non-negative whole number.", 400);
    }
    set.currentPage = updates.currentPage;
  }
  if (updates.rating !== undefined) {
    const rating = updates.rating;
    if (
      rating !== null &&
      (typeof rating !== "number" ||
        rating < 1 ||
        rating > 5 ||
        rating * 2 !== Math.floor(rating * 2))
    ) {
      return jsonError("Rating must be from 1 to 5 in half-star steps.", 400);
    }
    set.rating = rating;
  }
  if (updates.review !== undefined) {
    if (typeof updates.review !== "string" || updates.review.length > 5000) {
      return jsonError("Review must be 5,000 characters or fewer.", 400);
    }
    set.review = updates.review.trim();
  }
  for (const field of ["startedAt", "finishedAt"] as const) {
    if (updates[field] !== undefined) {
      const date = parseDate(updates[field]);
      if (date === undefined) {
        return jsonError("Enter a valid date.", 400);
      }
      set[field] = date;
    }
  }
  if (updates.collectionIds !== undefined) {
    const ids = updates.collectionIds;
    if (!isObjectIdList(ids)) {
      return jsonError("Select valid collections.", 400);
    }
    set.collectionIds = ids;
  }
  if (updates.bookOverrides !== undefined) {
    const overrides = updates.bookOverrides;
    if (!overrides || typeof overrides !== "object") {
      return jsonError("Invalid book overrides.", 400);
    }
    const overridesObj = overrides as Record<string, unknown>;
    const validated: Record<string, unknown> = {};
    
    if (overridesObj.title !== undefined) {
      if (typeof overridesObj.title !== "string" || overridesObj.title.trim().length === 0 || overridesObj.title.length > 300) {
        return jsonError("Title must be between 1 and 300 characters.", 400);
      }
      validated.title = overridesObj.title.trim();
    }
    
    if (overridesObj.authors !== undefined) {
      if (!Array.isArray(overridesObj.authors) || overridesObj.authors.length > 20 ||
          !overridesObj.authors.every((a) => typeof a === "string" && a.length <= 200)) {
        return jsonError("Authors must be an array of up to 20 strings, each 200 characters or fewer.", 400);
      }
      validated.authors = overridesObj.authors.map((a) => String(a).trim());
    }
    
    if (overridesObj.isbn !== undefined) {
      if (typeof overridesObj.isbn !== "string" || overridesObj.isbn.length > 20) {
        return jsonError("ISBN must be 20 characters or fewer.", 400);
      }
      validated.isbn = overridesObj.isbn.trim();
    }
    
    if (overridesObj.pageCount !== undefined) {
      if (overridesObj.pageCount !== null && 
          (typeof overridesObj.pageCount !== "number" || 
           !Number.isInteger(overridesObj.pageCount) || 
           overridesObj.pageCount < 0)) {
        return jsonError("Page count must be a non-negative integer.", 400);
      }
      validated.pageCount = overridesObj.pageCount;
    }
    
    if (overridesObj.coverUrl !== undefined) {
      if (overridesObj.coverUrl === null || overridesObj.coverUrl === "") {
        validated.coverUrl = "";
      } else if (typeof overridesObj.coverUrl === "string") {
        if (overridesObj.coverUrl.length > 2048) {
          return jsonError("Cover URL must be 2048 characters or fewer.", 400);
        }
        try {
          const url = new URL(overridesObj.coverUrl);
          if (url.protocol !== "https:" && url.protocol !== "http:") {
            return jsonError("Cover URL must be an HTTP or HTTPS URL.", 400);
          }
          validated.coverUrl = url.toString();
        } catch {
          return jsonError("Invalid URL format for cover.", 400);
        }
      } else {
        return jsonError("Cover URL must be a string.", 400);
      }
    }
    
    set["bookOverrides"] = validated;
  }
  if (!Object.keys(set).length) {
    return jsonError("No changes provided.", 400);
  }

  await connectDB();
  if (
    set.collectionIds &&
    !(await ownsCollections(set.collectionIds as string[], userId))
  ) {
    return jsonError("One or more collections could not be found.", 400);
  }
  const entry = await UserBook.findOne({ _id: id, userId });
  if (!entry) return jsonError("Book not found.", 404);
  const updatedOverrides = set.bookOverrides as
    | Record<string, unknown>
    | undefined;
  const overridesPageCountChanged =
    !!updatedOverrides &&
    Object.prototype.hasOwnProperty.call(updatedOverrides, "pageCount");
  if (set.currentPage !== undefined || overridesPageCountChanged) {
    const catalogBook = await Book.findById(entry.bookId)
      .select("pageCount")
      .lean();
    const overridePageCount = overridesPageCountChanged
      ? updatedOverrides?.pageCount
      : entry.bookOverrides?.pageCount;
    const pageCount =
      typeof overridePageCount === "number"
        ? overridePageCount
        : catalogBook?.pageCount;
    const currentPage =
      typeof set.currentPage === "number"
        ? set.currentPage
        : entry.currentPage ?? 0;
    if (!isValidCurrentPage(currentPage, pageCount)) {
      return jsonError("Current page cannot exceed the book's page count.", 400);
    }
  }

  const statusChanged = set.status !== undefined && set.status !== entry.status;
  if (
    statusChanged &&
    set.status === Shelf.CurrentlyReading &&
    !entry.startedAt &&
    !set.startedAt
  ) {
    set.startedAt = new Date();
  }
  if (
    statusChanged &&
    set.status === Shelf.Read &&
    !entry.finishedAt &&
    !set.finishedAt
  ) {
    set.finishedAt = new Date();
  }
  Object.assign(entry, set);
  await entry.save();
  return Response.json({ success: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Book not found.", 404);
  }
  await connectDB();
  const deleted = await UserBook.findOneAndDelete({ _id: id, userId });
  if (!deleted) return jsonError("Book not found.", 404);
  return Response.json({ success: true });
}
