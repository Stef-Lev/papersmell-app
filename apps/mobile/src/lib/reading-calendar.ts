import type { BookEntry } from "./types";

export type CalendarDay = {
  date: string;
  day: number;
  books: BookEntry[];
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value
    : null;
}

function readingRange(entry: BookEntry, today: string) {
  if (entry.status === "currently-reading") {
    const startedAt = validDate(entry.startedAt);
    if (!startedAt || startedAt > today) return null;
    return { start: startedAt, end: today };
  }
  if (entry.status !== "read") return null;

  const finishedAt = validDate(entry.finishedAt);
  if (!finishedAt || finishedAt > today) return null;
  const startedAt = validDate(entry.startedAt);
  return {
    start: startedAt && startedAt <= finishedAt ? startedAt : finishedAt,
    end: finishedAt,
  };
}

export function getMonthCalendar(
  entries: BookEntry[],
  year: number,
  month: number,
  now = new Date(),
): (CalendarDay | null)[] {
  const today = now.toISOString().slice(0, 10);
  const firstDay = new Date(Date.UTC(year, month, 1));
  const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const ranges = entries.flatMap((entry) => {
    const range = readingRange(entry, today);
    return range ? [{ entry, ...range }] : [];
  });
  const cells: (CalendarDay | null)[] = Array.from(
    { length: firstDay.getUTCDay() },
    () => null,
  );

  for (let day = 1; day <= dayCount; day += 1) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      date,
      day,
      books: ranges
        .filter((range) => range.start <= date && date <= range.end)
        .map((range) => range.entry),
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
