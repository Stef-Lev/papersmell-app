import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookSource } from "@/lib/book-source";
import type { CatalogBook } from "@/lib/open-library";

const catalog = vi.hoisted(() => ({
  stored: [] as CatalogBook[],
  storedText: [] as CatalogBook[],
  biblionet: null as CatalogBook | null,
  biblionetFails: false,
  openLibrary: [] as CatalogBook[],
  openLibraryFails: false,
}));

vi.mock("@/lib/local-catalog", () => ({
  findStoredBooksByIsbn: async () => catalog.stored,
  findStoredBooksByText: async () => catalog.storedText,
}));

vi.mock("@/lib/biblionet", () => ({
  fetchBiblionetBook: async () => {
    if (catalog.biblionetFails) throw new Error("Biblionet is down");
    return catalog.biblionet;
  },
}));

vi.mock("@/lib/open-library", () => ({
  searchOpenLibrary: async () => {
    if (catalog.openLibraryFails) throw new Error("Open Library is down");
    return catalog.openLibrary;
  },
}));

const { searchCatalog } = await import("./catalog-search");

const GREEK_ISBN = "9789602116524";
const FOREIGN_ISBN = "9780306406157";

function book(
  source: CatalogBook["source"],
  externalId: string,
  extra: Partial<CatalogBook> = {},
): CatalogBook {
  return {
    source,
    externalId,
    title: `Book ${externalId}`,
    authors: [],
    pageCount: 0,
    categories: [],
    ...extra,
  };
}

const biblionetBook = book(BookSource.Biblionet, "1", { isbn: GREEK_ISBN });
const openLibraryBook = (id: string, extra: Partial<CatalogBook> = {}) =>
  book(BookSource.OpenLibrary, `/works/${id}`, extra);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  Object.assign(catalog, {
    stored: [],
    storedText: [],
    biblionet: null,
    biblionetFails: false,
    openLibrary: [],
    openLibraryFails: false,
  });
});

describe("searchCatalog", () => {
  describe("with a Greek ISBN", () => {
    it("should return the book already stored from Biblionet", async () => {
      catalog.stored = [biblionetBook];
      catalog.biblionetFails = true;

      expect(await searchCatalog(GREEK_ISBN)).toEqual([biblionetBook]);
    });

    it("should fetch the book from Biblionet when we don't have it", async () => {
      catalog.biblionet = biblionetBook;

      expect(await searchCatalog("978-960-211-652-4")).toEqual([biblionetBook]);
    });

    it("should find nothing, never asking Open Library, when Biblionet lacks it", async () => {
      catalog.openLibrary = [openLibraryBook("OL1")];
      catalog.openLibraryFails = true;

      expect(await searchCatalog(GREEK_ISBN)).toEqual([]);
    });

    it("should report a Biblionet outage instead of finding nothing", async () => {
      catalog.biblionetFails = true;

      await expect(searchCatalog(GREEK_ISBN)).rejects.toThrow("Biblionet is down");
    });

    it("should prefer the Biblionet record over a stored Open Library copy", async () => {
      catalog.stored = [openLibraryBook("OL1", { isbn: GREEK_ISBN })];
      catalog.biblionet = biblionetBook;

      expect(await searchCatalog(GREEK_ISBN)).toEqual([biblionetBook]);
    });

    it("should fall back to a stored Open Library copy when Biblionet lacks it", async () => {
      const stored = openLibraryBook("OL1", { isbn: GREEK_ISBN });
      catalog.stored = [stored];

      expect(await searchCatalog(GREEK_ISBN)).toEqual([stored]);
    });

    it("should ignore a price add-on from a barcode scan", async () => {
      catalog.biblionet = biblionetBook;

      expect(await searchCatalog(`${GREEK_ISBN}51995`)).toEqual([biblionetBook]);
    });
  });

  describe("with a foreign ISBN", () => {
    it("should return the stored book without asking Open Library", async () => {
      const stored = openLibraryBook("OL1", { isbn: FOREIGN_ISBN });
      catalog.stored = [stored];
      catalog.openLibraryFails = true;

      expect(await searchCatalog(FOREIGN_ISBN)).toEqual([stored]);
    });

    it("should look it up in Open Library when we don't have it", async () => {
      const found = openLibraryBook("OL2", { isbn: FOREIGN_ISBN });
      catalog.openLibrary = [found];
      catalog.biblionetFails = true;

      expect(await searchCatalog("0-306-40615-2")).toEqual([found]);
    });
  });

  describe("with a title or author", () => {
    it("should return only our books when we have enough matches", async () => {
      catalog.storedText = Array.from({ length: 5 }, (_, index) =>
        openLibraryBook(`OL${index}`),
      );
      catalog.openLibraryFails = true;

      expect(await searchCatalog("dune")).toEqual(catalog.storedText);
    });

    it("should add Open Library results after ours when we have few matches", async () => {
      const ours = openLibraryBook("OL1", { isbn: "111" });
      const duplicate = openLibraryBook("OL9", { isbn: "111" });
      const other = openLibraryBook("OL2");
      catalog.storedText = [ours];
      catalog.openLibrary = [duplicate, other];

      expect(await searchCatalog("dune")).toEqual([ours, other]);
    });

    it("should keep our matches when Open Library is down", async () => {
      const ours = openLibraryBook("OL1");
      catalog.storedText = [ours];
      catalog.openLibraryFails = true;

      expect(await searchCatalog("dune")).toEqual([ours]);
    });

    it("should report an Open Library outage when we have no matches", async () => {
      catalog.openLibraryFails = true;

      await expect(searchCatalog("dune")).rejects.toThrow("Open Library is down");
    });

    it("should never ask Biblionet", async () => {
      catalog.biblionetFails = true;
      catalog.openLibrary = [openLibraryBook("OL1")];

      expect(await searchCatalog("Οδύσσεια")).toEqual(catalog.openLibrary);
    });
  });
});
