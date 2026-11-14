export type Shelf =
  | "to-read"
  | "currently-reading"
  | "read"
  | "did-not-finish";

export const shelves: Shelf[] = [
  "to-read",
  "currently-reading",
  "read",
  "did-not-finish",
];

export enum LibrarySort {
  Title = "title",
  Author = "author",
  Rating = "rating",
  PageCount = "page-count",
  DateAdded = "date-added",
}

export const shelfLabels: Record<Shelf, string> = {
  "to-read": "To Read",
  "currently-reading": "Currently Reading",
  read: "Read",
  "did-not-finish": "Did Not Finish",
};

export type BookSource =
  | "open-library"
  | "biblionet"
  | "papersmell"
  | "manual"
  | "google-books";

export type CatalogBook = {
  source: BookSource;
  externalId?: string;
  isbn?: string;
  title: string;
  authors: string[];
  pageCount: number;
  categories: string[];
  coverUrl?: string;
  publishedDate?: string;
  description?: string;
};

export type BookEntry = {
  id: string;
  status: Shelf;
  currentPage: number;
  rating: number | null;
  review: string;
  startedAt: string;
  finishedAt: string;
  collectionIds: string[];
  createdAt: string;
  book: CatalogBook & { id: string };
  bookOverrides?: Partial<
    Pick<CatalogBook, "title" | "authors" | "isbn" | "pageCount" | "coverUrl">
  >;
};

export type BookCollection = { id: string; name: string };

export type MobileProfile = {
  id: string;
  name: string;
  email: string;
  hasAvatar: boolean;
  avatarVersion: string;
};

export type MobileSession = {
  token: string;
  expiresAt: number;
  user: { name: string; email: string };
};

export type LibraryResponse = {
  entries: BookEntry[];
  collections: BookCollection[];
};
