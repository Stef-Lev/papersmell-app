import { isAdminSession } from "@/lib/admin";
import { jsonError } from "@/lib/api";
import { fetchBiblionetBook } from "@/lib/biblionet";
import {
  findStoredBiblionetBook,
  storeCatalogBook,
} from "@/lib/biblionet-catalog";
import { toIsbn13 } from "@/lib/isbn";

async function lookup(isbnInput: unknown) {
  const isbn = typeof isbnInput === "string" ? toIsbn13(isbnInput) : null;
  if (!isbn) return { error: jsonError("Enter a valid ISBN.", 400) };

  try {
    const book = await fetchBiblionetBook({ isbn });
    if (!book) {
      return { error: jsonError("Biblionet has no book with this ISBN.", 404) };
    }
    return { book };
  } catch (error) {
    console.error("Biblionet lookup failed:", error);
    return {
      error: jsonError("Biblionet is unavailable. Please try again.", 502),
    };
  }
}

/** Previews what Biblionet returns for an ISBN, without saving anything. */
export async function GET(request: Request) {
  if (!(await isAdminSession())) return jsonError("Not found.", 404);

  const { book, error } = await lookup(
    new URL(request.url).searchParams.get("isbn"),
  );
  if (!book) return error;

  const stored = book.isbn ? await findStoredBiblionetBook(book.isbn) : null;
  return Response.json({ book, alreadyStored: Boolean(stored) });
}

/** Fetches the book from Biblionet again and saves it to our catalog. */
export async function POST(request: Request) {
  if (!(await isAdminSession())) return jsonError("Not found.", 404);

  const body: unknown = await request.json().catch(() => null);
  const { book, error } = await lookup(
    body && typeof body === "object" && "isbn" in body ? body.isbn : null,
  );
  if (!book) return error;

  const { created } = await storeCatalogBook(book);
  return Response.json({ book, created }, { status: created ? 201 : 200 });
}
