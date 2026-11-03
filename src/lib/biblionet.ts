import "server-only";
import { cacheLife } from "next/cache";
import {
  biblionetPersonName,
  extractBiblionetTitle,
  normalizeBiblionetTitle,
  type BiblionetTitle,
} from "@/lib/biblionet-normalize";
import type { CatalogBook } from "@/lib/open-library";

type BiblionetLookup = { isbn: string } | { titleId: string };

function credentials() {
  const username = process.env.BIBLIONET_USER;
  const password = process.env.BIBLIONET_PASSWORD;
  if (!username || !password) {
    throw new Error("Biblionet credentials are not configured.");
  }
  return { username, password };
}

// Some titles carry only a WriterID with an empty WriterName, so the name is looked up.
async function fetchBiblionetPersonName(personId: string) {
  "use cache";
  cacheLife("days");

  const response = await fetch("https://biblionet.gr/webservice/get_person", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials(), person: personId }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Biblionet request failed with status ${response.status}`);
  }
  return biblionetPersonName(
    extractBiblionetPerson(await response.json()),
  );
}

function extractBiblionetPerson(payload: unknown): BiblionetTitle | null {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractBiblionetPerson(item);
      if (found) return found;
    }
    return null;
  }
  return payload && typeof payload === "object" && "PersonsID" in payload
    ? (payload as BiblionetTitle)
    : null;
}

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

  const { username, password } = credentials();

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
  if (title) {
    const writerId = title.WriterID?.trim();
    if (!title.WriterName?.trim() && writerId && writerId !== "0") {
      title.WriterName = await fetchBiblionetPersonName(writerId);
    }
    return normalizeBiblionetTitle(title);
  }

  // Biblionet answers 200 with {"error":{"error":"..."}} for "no results" too.
  const message =
    data && typeof data === "object" && "error" in data
      ? JSON.stringify(data.error)
      : "";
  if (!message || message.includes("Δεν υπάρχουν αποτελέσματα")) return null;
  // Error payloads can echo the request body, so never include them in the message.
  throw new Error("Biblionet returned an error response.");
}
