export enum BookSource {
  GoogleBooks = "google-books",
  OpenLibrary = "open-library",
  Biblionet = "biblionet",
  Manual = "manual",
  /** Added by hand by an admin to the shared catalog. */
  PaperSmell = "papersmell",
}

/** Sources of books shared with every user; manual books stay private to their creator. */
export const SHARED_BOOK_SOURCES = [
  BookSource.Biblionet,
  BookSource.OpenLibrary,
  BookSource.PaperSmell,
];
