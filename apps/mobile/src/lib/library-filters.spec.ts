import { describe, expect, it } from "vitest";
import {
  createEmptyLibraryFilters,
  getLibraryFilterResults,
} from "./library-filters";
import {
  LibrarySort,
  type BookCollection,
  type BookEntry,
  type Shelf,
} from "./types";

const collections: BookCollection[] = [
  { id: "favorites", name: "Favorites" },
  { id: "classics", name: "Classics" },
];

function makeEntry({
  id,
  title,
  status,
  author,
  category,
  collectionId,
  isbn,
  rating,
}: {
  id: string;
  title: string;
  status: BookEntry["status"];
  author: string;
  category: string;
  collectionId: string;
  isbn?: string;
  rating?: number | null;
}): BookEntry {
  return {
    id,
    status,
    currentPage: 0,
    rating: rating ?? null,
    review: "",
    startedAt: "",
    finishedAt: "",
    collectionIds: [collectionId],
    createdAt: `2026-01-0${id}`,
    book: {
      id: `book-${id}`,
      source: "manual",
      title,
      authors: [author],
      pageCount: 100,
      categories: [category],
      isbn,
    },
  };
}

const entries = [
  makeEntry({
    id: "1",
    title: "Οδύσσεια",
    status: "read",
    author: "Alice",
    category: "Fantasy",
    collectionId: "favorites",
    isbn: "978-1-23",
    rating: 4,
  }),
  makeEntry({
    id: "2",
    title: "Second Book",
    status: "to-read",
    author: "Bob",
    category: "Fantasy",
    collectionId: "favorites",
  }),
  makeEntry({
    id: "3",
    title: "Third Book",
    status: "read",
    author: "Bob",
    category: "Mystery",
    collectionId: "classics",
  }),
];

describe("getLibraryFilterResults", () => {
  it("should match accent-insensitive searches and normalized ISBNs", () => {
    const filters = createEmptyLibraryFilters();

    expect(
      getLibraryFilterResults(entries, collections, filters, "οδυσσεια")
        .visibleEntries.map(({ id }) => id),
    ).toEqual(["1"]);
    expect(
      getLibraryFilterResults(entries, collections, filters, "978123")
        .visibleEntries.map(({ id }) => id),
    ).toEqual(["1"]);
  });

  it("should calculate facet counts against other facets and allow multiple collections", () => {
    const filters = {
      ...createEmptyLibraryFilters(),
      shelves: ["read"] satisfies Shelf[],
      authors: ["Alice"],
    };
    const results = getLibraryFilterResults(entries, collections, filters, "");

    expect(results.visibleEntries.map(({ id }) => id)).toEqual(["1"]);
    expect(results.authorOptions).toEqual([
      { value: "Alice", label: "Alice", count: 1 },
      { value: "Bob", label: "Bob", count: 1 },
    ]);

    const unavailableAuthor = {
      ...createEmptyLibraryFilters(),
      authors: ["Unavailable"],
    };
    expect(
      getLibraryFilterResults(entries, collections, unavailableAuthor, "")
        .authorOptions,
    ).toContainEqual({ value: "Unavailable", label: "Unavailable", count: 0 });

    const withCollections = {
      ...createEmptyLibraryFilters(),
      collectionIds: ["favorites", "classics"],
    };
    expect(
      getLibraryFilterResults(entries, collections, withCollections, "")
        .visibleEntries,
    ).toHaveLength(3);
  });

  it("should keep unrated books after rated books when sorting by rating", () => {
    const filters = {
      ...createEmptyLibraryFilters(),
      sortBy: LibrarySort.Rating,
    };

    expect(
      getLibraryFilterResults(entries, collections, filters, "").visibleEntries.map(
        ({ id }) => id,
      ),
    ).toEqual(["1", "2", "3"]);
  });
});
