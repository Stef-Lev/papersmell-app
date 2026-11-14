import { describe, expect, it } from "vitest";
import { getLibraryStats } from "./library-stats";
import type { BookEntry, Shelf } from "./types";

function entry(
  id: string,
  status: Shelf,
  finishedAt: string,
  pageCount: number,
  rating: number | null,
  startedAt = "",
): BookEntry {
  return {
    id,
    status,
    currentPage: 0,
    rating,
    review: "",
    startedAt,
    finishedAt,
    collectionIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    book: {
      id: `book-${id}`,
      source: "manual",
      title: `Title ${id}`,
      authors: ["Author"],
      pageCount,
      categories: [],
    },
  };
}

describe("mobile library statistics", () => {
  it("should count valid finished books and known pages for the current year", () => {
    const entries = [
      entry("one", "read", "2026-03-01", 100, 4.5),
      entry("two", "read", "2026-02-01", 200, 5, "2026-03-01"),
      entry("three", "read", "2027-01-01", 75, null),
      entry("four", "to-read", "", 0, null),
    ];

    const stats = getLibraryStats(entries, new Date("2026-06-15T00:00:00.000Z"));

    expect(stats.total).toBe(4);
    expect(stats.shelfCounts.read).toBe(3);
    expect(stats.readPercentage).toBe(75);
    expect(stats.finishedThisYear).toBe(1);
    expect(stats.pagesInFinishedBooks).toBe(100);
    expect(stats.topRated[0]?.rating).toBe(5);
  });
});
