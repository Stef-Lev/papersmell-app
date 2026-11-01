import type { LibraryFilterValues } from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";
import { LibraryFilterKey, LibrarySort } from "@/lib/library";

export const EMPTY_ARRAY: string[] = [];

export const filterDefaults: LibraryFilterValues = {
  [LibraryFilterKey.Shelf]: EMPTY_ARRAY,
  [LibraryFilterKey.Author]: EMPTY_ARRAY,
  [LibraryFilterKey.Category]: EMPTY_ARRAY,
  [LibraryFilterKey.Collection]: "",
  [LibraryFilterKey.SortBy]: LibrarySort.Title,
};

export function parseMultiSelectFilter(value: string | string[]): string[] {
  if (Array.isArray(value)) return value;
  return value ? value.split(",").filter(Boolean) : EMPTY_ARRAY;
}

export function serializeMultiSelectFilter(values: string[]): string {
  return values.join(",");
}

export function normalizeIsbn(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

// Entries without a value (unrated, unfinished) always sort after those with one.
export function compareMissingLast<T>(
  first: T | null | undefined,
  second: T | null | undefined,
  compare: (first: T, second: T) => number,
) {
  if (first == null || first === "")
    return second == null || second === "" ? 0 : 1;
  if (second == null || second === "") return -1;
  return compare(first, second);
}

export function filterValuesEqual(
  a: string | string[],
  b: string | string[],
): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }
  return a === b;
}
