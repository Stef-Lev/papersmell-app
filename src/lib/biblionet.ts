import "server-only";
import { cacheLife } from "next/cache";
import {
  extractBiblionetTitle,
  normalizeBiblionetTitle,
} from "@/lib/biblionet-normalize";
import type { CatalogBook } from "@/lib/open-library";

type BiblionetLookup = { isbn: string } | { titleId: string };

/** The normalized title, or null when Biblionet has no such title. */
export async function fetchBiblionetBook(
  lookup: BiblionetLookup,
): Promise<CatalogBook | null> {
  return fetchBiblionetBookCached(
    "isbn" in lookup ? "isbn" : "title",
    "isbn" in lookup ? lookup.isbn : lookup.titleId,
  );
}

// Cached so repeated lookups of one book don't spend the daily request quota.
async function fetchBiblionetBookCached(
  field: "isbn" | "title",
  value: string,
): Promise<CatalogBook | null> {
  "use cache";
  cacheLife("hours");

  const username = process.env.BIBLIONET_USER;
  const password = process.env.BIBLIONET_PASSWORD;
  if (!username || !password) {
    throw new Error("Biblionet credentials are not configured.");
  }

  const response = await fetch("https://biblionet.gr/webservice/get_title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, [field]: value }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Biblionet request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  const title = extractBiblionetTitle(data);
  if (title) return normalizeBiblionetTitle(title);

  // Biblionet answers 200 with {"error":{"error":"..."}} for "no results" too.
  const message =
    data && typeof data === "object" && "error" in data
      ? JSON.stringify(data.error)
      : "";
  if (!message || message.includes("Δεν υπάρχουν αποτελέσματα")) return null;
  // Error payloads can echo the request body, so never include them in the message.
  throw new Error("Biblionet returned an error response.");
}
