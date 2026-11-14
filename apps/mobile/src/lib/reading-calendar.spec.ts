import { describe, expect, it } from "vitest";
import { getMonthCalendar } from "./reading-calendar";
import type { BookEntry, Shelf } from "./types";

function entry(
  id: string,
  status: Shelf,
  startedAt: string,
  finishedAt: string,
): BookEntry {
  return {
    id,
    status,
    currentPage: 0,
    rating: null,
    review: "",
    startedAt,
    finishedAt,
    collectionIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    book: {
      id: `book-${id}`,
      source: "manual",
      title: `Title ${id}`,
      authors: [],
      pageCount: 0,
      categories: [],
    },
  };
}

describe("reading calendar", () => {
  it("should include a finished book on every valid day in its reading range", () => {
    const days = getMonthCalendar(
      [entry("finished", "read", "2026-05-03", "2026-05-05")],
      2026,
      4,
      new Date("2026-05-20T12:00:00.000Z"),
    );

    expect(days.find((day) => day?.date === "2026-05-02")?.books).toEqual([]);
    expect(days.find((day) => day?.date === "2026-05-03")?.books).toHaveLength(1);
    expect(days.find((day) => day?.date === "2026-05-05")?.books).toHaveLength(1);
    expect(days.find((day) => day?.date === "2026-05-06")?.books).toEqual([]);
  });

  it("should show an active book through today but exclude invalid and future dates", () => {
    const days = getMonthCalendar(
      [
        entry("active", "currently-reading", "2026-05-10", ""),
        entry("future", "read", "2026-05-24", "2026-05-25"),
      ],
      2026,
      4,
      new Date("2026-05-20T12:00:00.000Z"),
    );

    expect(days.find((day) => day?.date === "2026-05-09")?.books).toEqual([]);
    expect(days.find((day) => day?.date === "2026-05-20")?.books.map(({ id }) => id))
      .toEqual(["active"]);
    expect(days.find((day) => day?.date === "2026-05-25")?.books).toEqual([]);
  });
});
