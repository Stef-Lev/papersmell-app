import { BookSource } from "@/lib/book-source";
import { toIsbn13 } from "@/lib/isbn";
import type { CatalogBook } from "@/lib/open-library";

const BIBLIONET_ORIGIN = "https://biblionet.gr";

/** A title record as returned by Biblionet's get_title; every value is text. */
export type BiblionetTitle = Record<string, string | null | undefined>;

function text(value: string | null | undefined, max: number) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

// Biblionet also sends placeholder dates such as 1901-12-13 and 0000-00-00.
function validDate(value: string | null | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const year = Number(match[1]);
  return year >= 1450 && year <= new Date().getFullYear() + 2
    ? match[0]
    : undefined;
}

/** Unwraps the `[[{...}]]` / `{...}` shapes get_title answers with. */
export function extractBiblionetTitle(payload: unknown): BiblionetTitle | null {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractBiblionetTitle(item);
      if (found) return found;
    }
    return null;
  }
  if (payload && typeof payload === "object" && "TitlesID" in payload) {
    return payload as BiblionetTitle;
  }
  return null;
}

/** Maps a raw Biblionet title to the shape stored in our Book catalog. */
export function normalizeBiblionetTitle(
  raw: BiblionetTitle,
): CatalogBook | null {
  const externalId = text(raw.TitlesID, 20);
  const title = text(raw.Title, 300);
  if (!externalId || !title) return null;

  const author = text(raw.WriterName, 200);
  const category = text(raw.Category, 100);
  const cover = text(raw.CoverImage, 500);
  const pageCount = Number.parseInt(raw.PageNo ?? "", 10);

  return {
    source: BookSource.Biblionet,
    externalId,
    isbn: toIsbn13(raw.ISBN ?? "") ?? undefined,
    title,
    subtitle: text(raw.Subtitle, 300),
    authors: author ? [author] : [],
    publisher: text(raw.Publisher, 200),
    description: text(raw.Summary, 5000),
    pageCount: Number.isFinite(pageCount) && pageCount > 0 ? pageCount : 0,
    publishedDate: validDate(raw.CurrentPublishDate) ?? validDate(raw.FirstPublishDate),
    categories: category ? [category] : [],
    coverUrl: cover?.startsWith("/") ? `${BIBLIONET_ORIGIN}${cover}` : undefined,
  };
}
