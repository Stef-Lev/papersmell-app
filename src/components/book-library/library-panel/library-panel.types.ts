import type {
  BookCollection,
  BookEntryData,
  BookEntryProps,
} from "@/components/book-entry/book-entry.types";
import type { LibraryUrlFilters } from "@/components/book-library/book-library.types";
import type { LibrarySort, ShelfFilter } from "@/lib/library";
import type { Shelf } from "@/lib/shelves";

export type FilterState = {
  shelfFilter: ShelfFilter;
  authorFilter: string | string[];
  categoryFilter: string | string[];
  collectionFilter: string;
  sortBy: LibrarySort;
};

export type UseLibraryFiltersArgs = {
  entries: BookEntryData[];
  collections: BookCollection[];
  shelfNames: Record<Shelf, string>;
  initialFilters: LibraryUrlFilters;
};

export type LibraryPanelProps = {
  entries: BookEntryData[];
  collections: BookCollection[];
  libraryLoaded: boolean;
  libraryLoadFailed: boolean;
  initialFilters: LibraryUrlFilters;
  shelfNames: Record<Shelf, string>;
  entryLabels: BookEntryProps["labels"];
  busyId: string;
  onEntryChange: (id: string, changes: Partial<BookEntryData>) => void;
  onEntrySave: (entry: BookEntryData) => void;
  onEntryRemove: (entry: BookEntryData) => void;
  onCollectionsChange: (collections: BookCollection[]) => void;
  onCollectionDeleted: (id: string) => void;
};
