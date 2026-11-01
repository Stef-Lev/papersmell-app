import { cacheLife } from "next/cache";
import { BookSource } from "@/lib/book-source";

export type CatalogBook = {
  source: BookSource.OpenLibrary;
  externalId: string;
  isbn?: string;
  title: string;
  authors: string[];
  pageCount: number;
  publishedDate?: string;
  categories: string[];
  coverUrl?: string;
};

/** A book about to be added to a library: a catalog result or a manual entry. */
export type NewBook = Omit<CatalogBook, "source" | "externalId"> & {
  source: BookSource.OpenLibrary | BookSource.Manual;
  externalId?: string;
};

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
  first_publish_year?: number;
  subject?: string[];
  cover_i?: number;
};

type OpenLibraryResponse = { docs?: OpenLibraryDoc[] };

export async function searchOpenLibrary(query: string): Promise<CatalogBook[]> {
  const normalizedQuery = query.trim();
  const normalizedIsbn = normalizedQuery
    .replace(/^ISBN(?:-1[03])?\s*:?\s*/i, "")
    .replace(/[\s\u2010-\u2015-]/g, "")
    .toUpperCase();
  const params = new URLSearchParams({
    limit: "15",
    fields:
      "key,title,author_name,isbn,number_of_pages_median,first_publish_year,subject,cover_i",
  });
  if (/^(?:\d{9}[\dX]|\d{13})$/.test(normalizedIsbn)) {
    params.set("isbn", normalizedIsbn);
  } else {
    params.set("q", normalizedQuery);
  }

  return searchOpenLibraryCached(params.toString());
}

async function searchOpenLibraryCached(params: string): Promise<CatalogBook[]> {
  "use cache";
  cacheLife("hours");

  const response = await fetch(
    `https://openlibrary.org/search.json?${params}`,
    {
      headers: { "User-Agent": "PaperSmell/1.0 (book catalog search)" },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Open Library search failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as OpenLibraryResponse;
  const searchedIsbn = new URLSearchParams(params).get("isbn");
  return (data.docs ?? []).flatMap((doc) => {
    if (!doc.key || !doc.title) return [];
    return [
      {
        source: BookSource.OpenLibrary,
        externalId: doc.key,
        isbn: searchedIsbn ?? doc.isbn?.[0],
        title: doc.title,
        authors: doc.author_name ?? [],
        pageCount: doc.number_of_pages_median ?? 0,
        publishedDate: doc.first_publish_year?.toString(),
        categories: doc.subject?.slice(0, 5) ?? [],
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
      },
    ];
  });
}
