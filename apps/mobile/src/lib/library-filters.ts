import {
  LibrarySort,
  shelves,
  type BookCollection,
  type BookEntry,
  type Shelf,
} from "./types";

export type LibraryFilterValues = {
  shelves: Shelf[];
  authors: string[];
  categories: string[];
  collectionIds: string[];
  sortBy: LibrarySort;
};

export type LibraryFilterSectionKey =
  | "sortBy"
  | "shelf"
  | "author"
  | "category"
  | "collection";

export type LibraryFilterOption = {
  value: string;
  label: string;
  count?: number;
};

export type LibraryFilterResults = {
  visibleEntries: BookEntry[];
  shelfOptions: Array<LibraryFilterOption & { value: Shelf }>;
  authorOptions: LibraryFilterOption[];
  categoryOptions: LibraryFilterOption[];
  collectionOptions: LibraryFilterOption[];
};

export function createEmptyLibraryFilters(): LibraryFilterValues {
  return {
    shelves: [],
    authors: [],
    categories: [],
    collectionIds: [],
    sortBy: LibrarySort.Title,
  };
}

function normalizeAccentInsensitiveText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC")
    .replace(/ς/g, "σ");
}

function matchesSelected<T extends string>(
  selected: T[],
  actual: T[],
): boolean {
  return selected.length === 0 || selected.some((value) => actual.includes(value));
}

function normalizeIsbn(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function increment(counts: Map<string, number>, value: string) {
  counts.set(value, (counts.get(value) ?? 0) + 1);
}

function sortedKeys(counts: Map<string, number>, selected: string[]) {
  return [...new Set([...counts.keys(), ...selected])].sort((a, b) =>
    a.localeCompare(b),
  );
}

function compareEntries(sortBy: LibrarySort) {
  return (first: BookEntry, second: BookEntry) => {
    switch (sortBy) {
      case LibrarySort.Author:
        return (first.book.authors[0] ?? "").localeCompare(
          second.book.authors[0] ?? "",
        );
      case LibrarySort.Rating:
        if (first.rating === null) return second.rating === null ? 0 : 1;
        if (second.rating === null) return -1;
        return second.rating - first.rating;
      case LibrarySort.PageCount:
        return second.book.pageCount - first.book.pageCount;
      case LibrarySort.DateAdded:
        return second.createdAt.localeCompare(first.createdAt);
      default:
        return first.book.title.localeCompare(second.book.title);
    }
  };
}

export function getLibraryFilterResults(
  entries: BookEntry[],
  collections: BookCollection[],
  filters: LibraryFilterValues,
  query: string,
): LibraryFilterResults {
  const searchTerm = normalizeAccentInsensitiveText(query.trim());
  const isbnSearchTerm = normalizeIsbn(query);
  const shelfCounts = new Map<Shelf, number>();
  const authorCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const collectionCounts = new Map<string, number>();
  const visibleEntries: BookEntry[] = [];

  for (const entry of entries) {
    if (searchTerm) {
      const searchText = [
        entry.book.title,
        ...entry.book.authors,
        ...entry.book.categories,
        entry.book.isbn ?? "",
      ].some((value) =>
        normalizeAccentInsensitiveText(value).includes(searchTerm),
      );
      const matchesIsbn =
        !!isbnSearchTerm &&
        normalizeIsbn(entry.book.isbn ?? "").includes(isbnSearchTerm);
      if (!searchText && !matchesIsbn) continue;
    }

    const shelfMatches =
      filters.shelves.length === 0 || filters.shelves.includes(entry.status);
    const authorMatches = matchesSelected(filters.authors, entry.book.authors);
    const categoryMatches = matchesSelected(
      filters.categories,
      entry.book.categories,
    );
    const collectionMatches = matchesSelected(
      filters.collectionIds,
      entry.collectionIds,
    );

    if (collectionMatches && authorMatches && categoryMatches) {
      increment(shelfCounts, entry.status);
    }
    if (shelfMatches && authorMatches && categoryMatches) {
      entry.collectionIds.forEach((id) => increment(collectionCounts, id));
    }
    if (shelfMatches && collectionMatches && categoryMatches) {
      entry.book.authors.forEach((author) => increment(authorCounts, author));
    }
    if (shelfMatches && collectionMatches && authorMatches) {
      entry.book.categories.forEach((category) =>
        increment(categoryCounts, category),
      );
    }

    if (shelfMatches && authorMatches && categoryMatches && collectionMatches) {
      visibleEntries.push(entry);
    }
  }

  return {
    visibleEntries: visibleEntries.sort(compareEntries(filters.sortBy)),
    shelfOptions: shelves.map((shelf) => ({
      value: shelf,
      label: shelf,
      count: shelfCounts.get(shelf) ?? 0,
    })),
    authorOptions: sortedKeys(authorCounts, filters.authors).map((author) => ({
      value: author,
      label: author,
      count: authorCounts.get(author) ?? 0,
    })),
    categoryOptions: sortedKeys(categoryCounts, filters.categories).map(
      (category) => ({
        value: category,
        label: category,
        count: categoryCounts.get(category) ?? 0,
      }),
    ),
    collectionOptions: collections
      .filter(
        ({ id }) =>
          collectionCounts.has(id) || filters.collectionIds.includes(id),
      )
      .map(({ id, name }) => ({
        value: id,
        label: name,
        count: collectionCounts.get(id) ?? 0,
      })),
  };
}
