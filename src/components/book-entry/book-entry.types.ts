import type { BookSource } from "@/lib/book-source";
import type { Shelf } from "@/lib/shelves";

export type { Shelf };

export type BookEntryData = {
  id: string;
  status: Shelf;
  currentPage?: number;
  rating: number | null;
  review: string;
  startedAt: string;
  finishedAt: string;
  collectionIds: string[];
  createdAt: string;
  book: {
    id: string;
    source: BookSource;
    externalId?: string;
    title: string;
    authors: string[];
    isbn?: string;
    pageCount: number;
    categories: string[];
    coverUrl?: string;
    publishedDate?: string;
  };
  bookOverrides?: {
    title?: string;
    authors?: string[];
    isbn?: string;
    pageCount?: number;
    coverUrl?: string;
  };
};

export type BookCollection = { id: string; name: string };

export type BookEntryProps = {
  entry: BookEntryData;
  collections: BookCollection[];
  shelfNames: Record<Shelf, string>;
  labels: {
    author: string;
    noAuthor: string;
    rating: string;
    noRating: string;
    review: string;
    startedAt: string;
    finishedAt: string;
    status: string;
    collection: string;
    noCollection: string;
    save: string;
    remove: string;
    removeTitle: string;
    confirmRemove: (title: string) => string;
    cancel: string;
    saving: string;
    pages: string;
    editBookDetails: string;
    title: string;
    authors: string;
    isbn: string;
    pageCount: string;
    coverUrl: string;
    addAuthor: string;
    close: string;
  };
  onChange: (id: string, changes: Partial<BookEntryData>) => void;
  onSave: (entry: BookEntryData) => void;
  onRemove: (entry: BookEntryData) => void;
  busy: boolean;
};
