import "server-only";
import { after } from "next/server";
import { storeCatalogBook } from "@/lib/biblionet-catalog";
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

/** Saves books to our catalog after the response is sent, so searching stays fast. */
function saveInBackground(books: CatalogBook[]) {
  after(async () => {
    for (const book of books) {
      await storeCatalogBook(book).catch((error: unknown) =>
        console.error("Saving catalog book failed:", error),
      );
    }
  });
}

/**
 * Our own catalog is searched first. An ISBN found there is returned alone;
 * otherwise a Greek ISBN is looked up in Biblionet, and everything else falls
 * back to Open Library. Text searches show our matches first. With
 * `saveFound` (admins only), books found by ISBN in an external source are
 * saved to our catalog.
 */
export async function searchCatalog(
  query: string,
  { saveFound = false }: { saveFound?: boolean } = {},
): Promise<CatalogBook[]> {
  if (toIsbn13(query)) {
    const stored = await safely(
      "Local ISBN lookup",
      () => findStoredBooksByIsbn(query),
      [],
    );
    if (stored.length) return stored;

    const greekIsbn = toGreekIsbn13(query);
    if (greekIsbn) {
      const fetched = await safely(
        "Biblionet lookup",
        () => fetchBiblionetBook({ isbn: greekIsbn }),
        null,
      );
      if (fetched) {
        if (saveFound) saveInBackground([fetched]);
        return [fetched];
      }
    }
    const found = await searchOpenLibrary(query);
    if (saveFound) saveInBackground(found);
    return found;
  }

  const [stored, external] = await Promise.all([
    safely("Local text search", () => findStoredBooksByText(query), []),
    searchOpenLibrary(query),
  ]);
  return dedupe([...stored, ...external]);
}
