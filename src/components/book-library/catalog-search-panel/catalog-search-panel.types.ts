import type {
  BookCollection,
  BookEntryData,
} from "@/components/book-entry/book-entry.types";
import type { Shelf } from "@/lib/shelves";

export type CatalogSearchPanelProps = {
  initialQuery: string;
  entries: BookEntryData[];
  collections: BookCollection[];
  libraryLoaded: boolean;
  shelfNames: Record<Shelf, string>;
  onBookAdded: () => Promise<void>;
};
