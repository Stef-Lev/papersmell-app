import "server-only";
import { BookSource } from "@/lib/book-source";
import { fetchBiblionetBook } from "@/lib/biblionet";
import { toGreekIsbn13, toIsbn13 } from "@/lib/isbn";
import {
  findStoredBooksByIsbn,
  findStoredBooksByText,
} from "@/lib/local-catalog";
import { searchOpenLibrary, type CatalogBook } from "@/lib/open-library";

async function safely<T>(label: string, work: () => Promise<T>, fallback: T) {
  try {
    return await work();
  } catch (error) {
    console.error(`${label} failed:`, error);
    return fallback;
  }
}

function dedupe(books: CatalogBook[]) {
  const seen = new Set<string>();
  return books.filter((book) => {
    const keys = [`${book.source}:${book.externalId}`];
    if (book.isbn) keys.push(`isbn:${book.isbn}`);
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

// Open Library is only queried for text when our catalog has fewer matches than this.
const MIN_LOCAL_TEXT_RESULTS = 5;

/**
 * Searches never save anything: a book is added to our catalog only when a
 * user adds it to their library.
 *
 * - Greek ISBN: our catalog, then Biblionet. Open Library is never used, so
 *   an unknown Greek ISBN is simply not found. Biblionet failures are thrown
 *   rather than reported as "not found".
 * - Other ISBN: our catalog, then Open Library.
 * - Title or author: our catalog first; Open Library only tops up when we have
 *   few matches, and its failure is tolerated when we already have results.
 */
export async function searchCatalog(query: string): Promise<CatalogBook[]> {
  const isbn13 = toIsbn13(query);
  if (isbn13) {
    const stored = await safely(
      "Local ISBN lookup",
      () => findStoredBooksByIsbn(isbn13),
      [],
    );

    if (toGreekIsbn13(isbn13)) {
      // A stored Open Library copy must not hide the richer Biblionet record,
      // but a book an admin added by hand is used as-is.
      const preferred = stored.filter(
        (book) =>
          book.source === BookSource.Biblionet ||
          book.source === BookSource.PaperSmell,
      );
      if (preferred.length) return preferred;
      const fetched = stored.length
        ? await safely(
            "Biblionet lookup",
            () => fetchBiblionetBook({ isbn: isbn13 }),
            null,
          )
        : await fetchBiblionetBook({ isbn: isbn13 });
      return fetched ? [fetched] : stored;
    }

    if (stored.length) return stored;
    return searchOpenLibrary(isbn13);
  }

  const stored = await safely(
    "Local text search",
    () => findStoredBooksByText(query),
    [],
  );
  if (stored.length >= MIN_LOCAL_TEXT_RESULTS) return stored;

  const external = stored.length
    ? await safely("Open Library search", () => searchOpenLibrary(query), [])
    : await searchOpenLibrary(query);
  return dedupe([...stored, ...external]);
}
