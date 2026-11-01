import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { BookSource } from "@/lib/book-source";
import type { NewBook } from "@/lib/open-library";
import { renderWithIntl, t } from "@/test/utils";
import SearchPage from "./search-page";
import type { SearchPageProps } from "./search-page.types";

const catalog: NewBook[] = [
  {
    source: BookSource.OpenLibrary,
    externalId: "OL1W",
    title: "Dune",
    authors: ["Frank Herbert"],
    pageCount: 412,
    categories: ["Science fiction"],
  },
  {
    source: BookSource.OpenLibrary,
    externalId: "OL2W",
    title: "Emma",
    authors: ["Jane Austen"],
    pageCount: 474,
    categories: ["Romance"],
  },
];

// In-memory stand-ins for GET /api/library and GET /api/books/search.
function stubApis() {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    if (url.pathname === "/api/library")
      return Response.json({ entries: [], collections: [] });
    if (url.pathname === "/api/books/search") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      return Response.json({
        results: catalog.filter((book) => book.title.toLowerCase().includes(q)),
      });
    }
    return new Response(null, { status: 404 });
  });
}

async function renderPage(params: Awaited<SearchPageProps["searchParams"]>) {
  const page = await SearchPage({ searchParams: Promise.resolve(params) });
  return renderWithIntl(<ToastProvider>{page}</ToastProvider>);
}

describe("SearchPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should render the search heading and an empty search field", async () => {
    stubApis();
    await renderPage({});

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("nav.searchLabel"),
    );
    expect(
      screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
    ).toHaveValue("");
    expect(
      screen.queryByRole("heading", { level: 3 }),
    ).not.toBeInTheDocument();
  });

  it("should prefill the search and show results for the q parameter", async () => {
    stubApis();
    await renderPage({ q: "dune" });

    expect(
      screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
    ).toHaveValue("dune");
    expect(
      await screen.findByRole("heading", { level: 3, name: "Dune" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Emma" }),
    ).not.toBeInTheDocument();
  });

  it("should use the first q value when the parameter is repeated", async () => {
    stubApis();
    await renderPage({ q: ["emma", "dune"] });

    expect(
      screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
    ).toHaveValue("emma");
    expect(
      await screen.findByRole("heading", { level: 3, name: "Emma" }),
    ).toBeInTheDocument();
  });

  it("should tell the user when the q parameter matches no books", async () => {
    stubApis();
    await renderPage({ q: "zzz" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("libraryWorkspace.noSearchResults"),
    );
  });
});
