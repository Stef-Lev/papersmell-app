import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  compareMissingLast,
  filterDefaults,
  normalizeIsbn,
  parseMultiSelectFilter,
  serializeMultiSelectFilter,
} from "@/components/book-library/filter-utils";
import type {
  LibraryFilterSection,
  LibraryFilterValues,
} from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";
import type {
  BookCollection,
  BookEntryData,
} from "@/components/book-entry/book-entry.types";
import {
  ALL_SHELVES,
  LibraryFilterKey,
  LibrarySort,
  toLibrarySort,
} from "@/lib/library";
import { SHELVES, Shelf } from "@/lib/shelves";
import type {
  FilterState,
  UseLibraryFiltersArgs,
} from "./library-panel.types";

function getInitialFilters(
  initialFilters: UseLibraryFiltersArgs["initialFilters"],
): FilterState {
  const status = initialFilters.status;
  return {
    shelfFilter: !status || status === ALL_SHELVES ? [] : [status as Shelf],
    authorFilter: parseMultiSelectFilter(initialFilters.author ?? ""),
    categoryFilter: parseMultiSelectFilter(initialFilters.category ?? ""),
    collectionFilter: initialFilters.collection ?? "",
    sortBy: toLibrarySort(initialFilters.sort),
  };
}

function toList(value: string | string[]) {
  return Array.isArray(value) ? value : parseMultiSelectFilter(String(value));
}

type Selection = {
  shelves: string[];
  authors: string[];
  categories: string[];
  collection: string;
};

function matchesQuery(
  entry: BookEntryData,
  searchText: string[],
  searchTerm: string,
  isbnSearchTerm: string,
) {
  return (
    !searchTerm ||
    searchText.some((value) => value.includes(searchTerm)) ||
    (!!isbnSearchTerm &&
      normalizeIsbn(entry.book.isbn ?? "").includes(isbnSearchTerm))
  );
}

function matchesFacets(entry: BookEntryData, selection: Selection) {
  const shelf =
    selection.shelves.length === 0 ||
    selection.shelves.includes(entry.status);
  const collection =
    !selection.collection || entry.collectionIds.includes(selection.collection);
  const author =
    selection.authors.length === 0 ||
    selection.authors.some((value) => entry.book.authors.includes(value));
  const category =
    selection.categories.length === 0 ||
    selection.categories.some((value) => entry.book.categories.includes(value));
  return { shelf, collection, author, category };
}

function compareEntries(sortBy: LibrarySort) {
  return (a: BookEntryData, b: BookEntryData) => {
    switch (sortBy) {
      case LibrarySort.Author:
        return (a.book.authors[0] ?? "").localeCompare(b.book.authors[0] ?? "");
      case LibrarySort.Rating:
        return compareMissingLast(a.rating, b.rating, (x, y) => y - x);
      case LibrarySort.PageCount:
        return b.book.pageCount - a.book.pageCount;
      case LibrarySort.DateAdded:
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return a.book.title.localeCompare(b.book.title);
    }
  };
}

function increment<K>(map: Map<K, number>, key: K) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedKeys(counts: Map<string, number>, selected: string[]) {
  return [...new Set([...counts.keys(), ...selected])].sort((first, second) =>
    first.localeCompare(second),
  );
}

export function useLibraryFilters({
  entries,
  collections,
  shelfNames,
  initialFilters,
}: UseLibraryFiltersArgs) {
  const t = useTranslations("libraryWorkspace");
  const [libraryQuery, setLibraryQuery] = useState(initialFilters.q ?? "");
  const [filters, setFilters] = useState<FilterState>(() =>
    getInitialFilters(initialFilters),
  );

  // Debounced URL sync. Filter/sort changes get their own history entry; typing in search does not.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const values: [string, string, string][] = [
        ["q", libraryQuery.trim(), ""],
        ["status", serializeMultiSelectFilter(toList(filters.shelfFilter)), ""],
        [
          "author",
          serializeMultiSelectFilter(toList(filters.authorFilter)),
          "",
        ],
        [
          "category",
          serializeMultiSelectFilter(toList(filters.categoryFilter)),
          "",
        ],
        ["collection", filters.collectionFilter, ""],
        ["sort", filters.sortBy, LibrarySort.Title],
      ];
      for (const [key, value, fallback] of values) {
        if (value !== fallback) params.set(key, value);
      }
      const search = params.toString();
      const current = new URLSearchParams(window.location.search);
      if (search === current.toString()) return;
      const url = `${window.location.pathname}${search ? `?${search}` : ""}`;
      params.delete("q");
      current.delete("q");
      if (params.toString() === current.toString()) {
        window.history.replaceState(null, "", url);
      } else {
        window.history.pushState(null, "", url);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, libraryQuery]);

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      setFilters({
        shelfFilter: parseMultiSelectFilter(params.get("status") ?? ""),
        authorFilter: parseMultiSelectFilter(params.get("author") ?? ""),
        categoryFilter: parseMultiSelectFilter(params.get("category") ?? ""),
        collectionFilter: params.get("collection") ?? "",
        sortBy: toLibrarySort(params.get("sort")),
      });
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const searchTerm = useMemo(
    () => libraryQuery.trim().toLocaleLowerCase(),
    [libraryQuery],
  );
  const isbnSearchTerm = useMemo(
    () => normalizeIsbn(libraryQuery),
    [libraryQuery],
  );

  // Lowercased text per entry, computed once per entries change instead of per keystroke/filter.
  const searchIndex = useMemo(
    () =>
      entries.map((entry) =>
        [
          entry.book.title,
          ...entry.book.authors,
          ...entry.book.categories,
          entry.book.isbn ?? "",
        ].map((value) => value.toLocaleLowerCase()),
      ),
    [entries],
  );

  // One pass over entries yields the visible list and every facet's options and counts.
  // Each facet only reflects books matching the *other* filters.
  const { visibleEntries, authors, categories, collectionIdsInUse, facetCounts } =
    useMemo(() => {
      const selection: Selection = {
        shelves: toList(filters.shelfFilter),
        authors: toList(filters.authorFilter),
        categories: toList(filters.categoryFilter),
        collection: filters.collectionFilter,
      };
      const shelves = new Map<Shelf, number>();
      const authorCounts = new Map<string, number>();
      const categoryCounts = new Map<string, number>();
      const collectionCounts = new Map<string, number>();
      const filtered: BookEntryData[] = [];

      entries.forEach((entry, index) => {
        if (!matchesQuery(entry, searchIndex[index], searchTerm, isbnSearchTerm))
          return;
        const ok = matchesFacets(entry, selection);

        if (ok.collection && ok.author && ok.category)
          increment(shelves, entry.status);
        if (ok.shelf && ok.author && ok.category) {
          entry.collectionIds.forEach((id) => increment(collectionCounts, id));
        }
        if (ok.shelf && ok.collection && ok.category) {
          entry.book.authors.forEach((author) =>
            increment(authorCounts, author),
          );
        }
        if (ok.shelf && ok.collection && ok.author) {
          entry.book.categories.forEach((category) =>
            increment(categoryCounts, category),
          );
        }
        if (ok.shelf && ok.collection && ok.author && ok.category)
          filtered.push(entry);
      });

      return {
        visibleEntries: filtered.sort(compareEntries(filters.sortBy)),
        authors: sortedKeys(authorCounts, selection.authors),
        categories: sortedKeys(categoryCounts, selection.categories),
        collectionIdsInUse: new Set(collectionCounts.keys()),
        facetCounts: { shelves, authorCounts, categoryCounts, collectionCounts },
      };
    }, [entries, searchIndex, searchTerm, isbnSearchTerm, filters]);

  const statusOptions = useMemo(
    () =>
      SHELVES.map((shelf) => ({
        value: shelf,
        label: shelfNames[shelf],
        count: facetCounts.shelves.get(shelf) ?? 0,
      })),
    [facetCounts, shelfNames],
  );

  const authorOptions = useMemo(
    () =>
      authors.map((author) => ({
        value: author,
        label: author,
        count: facetCounts.authorCounts.get(author) ?? 0,
      })),
    [authors, facetCounts],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category,
        label: category,
        count: facetCounts.categoryCounts.get(category) ?? 0,
      })),
    [categories, facetCounts],
  );

  const collectionOptions = useMemo(
    () =>
      collections
        .filter(
          (collection: BookCollection) =>
            collectionIdsInUse.has(collection.id) ||
            collection.id === filters.collectionFilter,
        )
        .map((collection) => ({
          value: collection.id,
          label: collection.name,
          count: facetCounts.collectionCounts.get(collection.id) ?? 0,
        })),
    [collections, collectionIdsInUse, facetCounts, filters.collectionFilter],
  );

  const sortOptions = useMemo(
    () => [
      { value: LibrarySort.Title, label: t("sortTitle") },
      { value: LibrarySort.Author, label: t("sortAuthor") },
      { value: LibrarySort.Rating, label: t("sortRating") },
      { value: LibrarySort.PageCount, label: t("sortPageCount") },
      { value: LibrarySort.DateAdded, label: t("sortDateAdded") },
    ],
    [t],
  );

  const filterValues: LibraryFilterValues = useMemo(
    () => ({
      [LibraryFilterKey.Shelf]: filters.shelfFilter,
      [LibraryFilterKey.Author]: filters.authorFilter,
      [LibraryFilterKey.Category]: filters.categoryFilter,
      [LibraryFilterKey.Collection]: filters.collectionFilter,
      [LibraryFilterKey.SortBy]: filters.sortBy,
    }),
    [filters],
  );

  const filterSections: LibraryFilterSection[] = useMemo(
    () => [
      { key: LibraryFilterKey.SortBy, label: t("sortBy"), options: sortOptions },
      {
        key: LibraryFilterKey.Shelf,
        label: t("status"),
        options: statusOptions,
        multiSelect: true,
      },
      {
        key: LibraryFilterKey.Author,
        label: t("author"),
        options: authorOptions,
        multiSelect: true,
      },
      {
        key: LibraryFilterKey.Category,
        label: t("categories"),
        options: categoryOptions,
        multiSelect: true,
      },
      {
        key: LibraryFilterKey.Collection,
        label: t("collection"),
        options: collectionOptions,
        multiSelect: true,
      },
    ],
    [
      t,
      sortOptions,
      statusOptions,
      authorOptions,
      categoryOptions,
      collectionOptions,
    ],
  );

  function applyFilters(values: LibraryFilterValues) {
    const collectionValue = values[LibraryFilterKey.Collection];
    setFilters({
      shelfFilter: toList(values[LibraryFilterKey.Shelf]),
      authorFilter: toList(values[LibraryFilterKey.Author]),
      categoryFilter: toList(values[LibraryFilterKey.Category]),
      collectionFilter: Array.isArray(collectionValue)
        ? serializeMultiSelectFilter(collectionValue)
        : String(collectionValue),
      sortBy: toLibrarySort(String(values[LibraryFilterKey.SortBy])),
    });
  }

  function getFilteredResultCount(values: LibraryFilterValues): number {
    const selection: Selection = {
      shelves: toList(values[LibraryFilterKey.Shelf]),
      authors: toList(values[LibraryFilterKey.Author]),
      categories: toList(values[LibraryFilterKey.Category]),
      collection: String(values[LibraryFilterKey.Collection]),
    };
    return entries.filter((entry, index) => {
      if (!matchesQuery(entry, searchIndex[index], searchTerm, isbnSearchTerm))
        return false;
      const ok = matchesFacets(entry, selection);
      return ok.shelf && ok.collection && ok.author && ok.category;
    }).length;
  }

  function removeFilter(key: LibraryFilterKey) {
    applyFilters({ ...filterValues, [key]: filterDefaults[key] });
  }

  function removeFilterValue(key: LibraryFilterKey, value: string) {
    const remaining = parseMultiSelectFilter(
      filterValues[key] as string | string[],
    ).filter((item) => item !== value);
    applyFilters({
      ...filterValues,
      [key]: serializeMultiSelectFilter(remaining),
    });
  }

  function clearCollectionFilter(id: string) {
    setFilters((previous) =>
      previous.collectionFilter === id
        ? { ...previous, collectionFilter: "" }
        : previous,
    );
  }

  return {
    libraryQuery,
    setLibraryQuery,
    visibleEntries,
    filterValues,
    filterSections,
    applyFilters,
    getFilteredResultCount,
    removeFilter,
    removeFilterValue,
    clearCollectionFilter,
  };
}
