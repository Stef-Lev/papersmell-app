import type { BookEntry, Shelf } from "./types";

export type LibraryStats = {
  total: number;
  readPercentage: number;
  shelfCounts: Record<Shelf, number>;
  finishedThisYear: number;
  pagesInFinishedBooks: number;
  topRated: BookEntry[];
};

export function getValidFinishedAt(entry: BookEntry, now = new Date()) {
  if (entry.status !== "read" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.finishedAt)) {
    return null;
  }
  const finishedAt = new Date(`${entry.finishedAt}T00:00:00.000Z`);
  if (
    !Number.isFinite(finishedAt.getTime()) ||
    finishedAt.toISOString().slice(0, 10) !== entry.finishedAt ||
    finishedAt.getTime() > now.getTime()
  ) {
    return null;
  }
  if (entry.startedAt) {
    const startedAt = new Date(`${entry.startedAt}T00:00:00.000Z`);
    if (
      Number.isFinite(startedAt.getTime()) &&
      startedAt.getTime() > finishedAt.getTime()
    ) {
      return null;
    }
  }
  return finishedAt;
}

export function getLibraryStats(
  entries: BookEntry[],
  now = new Date(),
): LibraryStats {
  const shelfCounts: Record<Shelf, number> = {
    "to-read": 0,
    "currently-reading": 0,
    read: 0,
    "did-not-finish": 0,
  };
  for (const entry of entries) shelfCounts[entry.status] += 1;

  const currentYear = now.getUTCFullYear();
  const completedThisYear = entries.filter((entry) => {
    const finishedAt = getValidFinishedAt(entry, now);
    return finishedAt?.getUTCFullYear() === currentYear;
  });

  return {
    total: entries.length,
    readPercentage: entries.length
      ? Math.round((shelfCounts.read / entries.length) * 100)
      : 0,
    shelfCounts,
    finishedThisYear: completedThisYear.length,
    pagesInFinishedBooks: completedThisYear.reduce(
      (total, entry) =>
        total +
        (Number.isFinite(entry.book.pageCount) && entry.book.pageCount > 0
          ? entry.book.pageCount
          : 0),
      0,
    ),
    topRated: entries
      .filter(
        (entry) =>
          entry.rating !== null &&
          Number.isFinite(entry.rating) &&
          entry.rating >= 1 &&
          entry.rating <= 5,
      )
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 5),
  };
}
