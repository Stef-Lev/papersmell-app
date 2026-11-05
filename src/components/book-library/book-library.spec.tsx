import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import type {
  BookCollection,
  BookEntryData,
} from "@/components/book-entry/book-entry.types";
import { BookSource } from "@/lib/book-source";
import { LibraryMode } from "@/lib/library";
import type { NewBook } from "@/lib/open-library";
import { Shelf } from "@/lib/shelves";
import { renderWithIntl, t } from "@/test/utils";
import type { BookLibraryProps } from "./book-library.types";
import BookLibrary from "./book-library";

type ApiError = { status: number; error: string };

const favourites: BookCollection = { id: "col-favourites", name: "Favourites" };
const sciFi: BookCollection = { id: "col-sci-fi", name: "Sci-fi shelf" };

function makeEntry(
  id: string,
  book: Partial<BookEntryData["book"]> & { title: string },
  overrides: Partial<Omit<BookEntryData, "book">> = {},
): BookEntryData {
  return {
    id,
    status: Shelf.ToRead,
    rating: null,
    review: "",
    startedAt: "",
    finishedAt: "",
    collectionIds: [],
    createdAt: "2026-01-01T10:00:00.000Z",
    bookOverrides: {},
    ...overrides,
    book: {
      id: `book-${id}`,
      source: BookSource.OpenLibrary,
      authors: [],
      pageCount: 0,
      categories: [],
      ...book,
    },
  };
}

const dune = makeEntry(
  "entry-dune",
  {
    title: "Dune",
    authors: ["Frank Herbert"],
    externalId: "/works/OL893415W",
    isbn: "9780441013593",
    pageCount: 412,
    categories: ["Science Fiction"],
  },
  {
    status: Shelf.Read,
    rating: 5,
    review: "Epic world-building.",
    startedAt: "2026-01-02",
    finishedAt: "2026-01-20",
    collectionIds: [sciFi.id],
    createdAt: "2026-01-01T10:00:00.000Z",
  },
);

const emma = makeEntry(
  "entry-emma",
  {
    title: "Emma",
    authors: ["Jane Austen"],
    externalId: "/works/OL66562W",
    isbn: "9780141439587",
    pageCount: 474,
    categories: ["Classics"],
  },
  { collectionIds: [favourites.id], createdAt: "2026-03-01T10:00:00.000Z" },
);

const neuromancer = makeEntry(
  "entry-neuromancer",
  {
    title: "Neuromancer",
    authors: ["William Gibson"],
    externalId: "/works/OL27258W",
    isbn: "9780441569595",
    pageCount: 271,
    categories: ["Science Fiction", "Cyberpunk"],
  },
  {
    status: Shelf.CurrentlyReading,
    startedAt: "2026-02-10",
    createdAt: "2026-02-01T10:00:00.000Z",
  },
);

const catalog: NewBook[] = [
  {
    source: BookSource.OpenLibrary,
    externalId: "/works/OL893415W",
    title: "Dune",
    authors: ["Frank Herbert"],
    isbn: "9780441013593",
    pageCount: 412,
    categories: ["Science Fiction"],
  },
  {
    source: BookSource.OpenLibrary,
    externalId: "/works/OL893526W",
    title: "Dune Messiah",
    authors: ["Frank Herbert"],
    isbn: "9780441172696",
    pageCount: 256,
    categories: ["Science Fiction", "Space opera", "Classics"],
  },
];

/** In-memory stand-in for the library, collections and catalog API routes. */
function createFakeApi({
  entries = [dune, emma, neuromancer],
  collections = [favourites, sciFi],
}: { entries?: BookEntryData[]; collections?: BookCollection[] } = {}) {
  const store = {
    entries: structuredClone(entries),
    collections: structuredClone(collections),
  };
  const failures = new Map<string, ApiError>();
  let nextId = 1;

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  async function handle(input: RequestInfo | URL, init: RequestInit = {}) {
    const url = new URL(String(input), "http://localhost");
    const method = (init.method ?? "GET").toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const failure = failures.get(`${method} ${url.pathname}`);
    if (failure) {
      failures.delete(`${method} ${url.pathname}`);
      return json({ error: failure.error }, failure.status);
    }

    if (url.pathname === "/api/library" && method === "GET") {
      return json(structuredClone(store));
    }
    if (url.pathname === "/api/library" && method === "POST") {
      const { book, status, collectionIds } = body as {
        book: NewBook;
        status: Shelf;
        collectionIds: string[];
      };
      const id = `entry-new-${nextId++}`;
      store.entries.push(
        makeEntry(
          id,
          {
            ...book,
            authors: book.authors ?? [],
            categories: book.categories ?? [],
            pageCount: book.pageCount ?? 0,
          },
          { status, collectionIds, createdAt: new Date().toISOString() },
        ),
      );
      return json({ id }, 201);
    }
    const entryMatch = url.pathname.match(/^\/api\/library\/(.+)$/);
    if (entryMatch) {
      const entry = store.entries.find((item) => item.id === entryMatch[1]);
      if (!entry) return json({ error: "Book not found." }, 404);
      if (method === "PATCH") {
        Object.assign(entry, body);
      } else if (method === "DELETE") {
        store.entries = store.entries.filter((item) => item !== entry);
      }
      return json({ success: true });
    }
    if (url.pathname === "/api/books/search") {
      const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
      if (query.length < 2) {
        return json({ error: "Enter at least 2 characters to search." }, 400);
      }
      return json({
        results: catalog.filter(
          (book) =>
            book.title.toLowerCase().includes(query) || book.isbn === query,
        ),
      });
    }
    if (url.pathname === "/api/collections" && method === "POST") {
      const collection = {
        id: `col-new-${nextId++}`,
        name: String((body as { name: string }).name),
      };
      store.collections.push(collection);
      return json({ collection }, 201);
    }
    const collectionMatch = url.pathname.match(/^\/api\/collections\/(.+)$/);
    if (collectionMatch && method === "DELETE") {
      const id = collectionMatch[1];
      store.collections = store.collections.filter((item) => item.id !== id);
      store.entries.forEach((entry) => {
        entry.collectionIds = entry.collectionIds.filter((item) => item !== id);
      });
      return json({ success: true });
    }
    return json({ error: "Not found." }, 404);
  }

  return {
    fetch: handle,
    /** Makes the next request to `method path` fail with the given API error. */
    failNext(method: string, path: string, error: ApiError) {
      failures.set(`${method} ${path}`, error);
    },
  };
}

let api: ReturnType<typeof createFakeApi>;

function useApi(fakeApi: ReturnType<typeof createFakeApi>) {
  api = fakeApi;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    api.fetch(input, init),
  );
}

function renderLibrary(props: Partial<BookLibraryProps> = {}) {
  return renderWithIntl(
    <ToastProvider>
      <BookLibrary mode={LibraryMode.Library} {...props} />
    </ToastProvider>,
  );
}

async function renderLoadedLibrary(props: Partial<BookLibraryProps> = {}) {
  const view = renderLibrary(props);
  await screen.findByRole("button", {
    name: t("libraryWorkspace.manageCollections"),
  });
  await waitFor(() =>
    expect(
      screen.getByRole("button", {
        name: t("libraryWorkspace.manageCollections"),
      }),
    ).toBeEnabled(),
  );
  return view;
}

async function renderSearch(props: Partial<BookLibraryProps> = {}) {
  const view = renderLibrary({ mode: LibraryMode.Search, ...props });
  await waitFor(() =>
    expect(
      screen.queryByRole("status", { busy: true }),
    ).not.toBeInTheDocument(),
  );
  return view;
}

function getEntry(title: string) {
  return screen
    .getAllByRole("article")
    .find((article) =>
      within(article).queryByRole("heading", { level: 3, name: title }),
    )!;
}

async function findResult(title: string) {
  const heading = await screen.findByRole("heading", { level: 3, name: title });
  return heading.closest("article")!;
}

function expectEntryOrder(titles: string[]) {
  const headings = screen
    .getAllByRole("article")
    .map((article) => within(article).getByRole("heading", { level: 3 }));
  expect(headings).toHaveLength(titles.length);
  titles.forEach((title, index) =>
    expect(headings[index]).toHaveTextContent(title),
  );
}

async function expectToast(message: string) {
  await waitFor(() =>
    expect(
      within(
        screen.getByRole("region", { name: t("notifications.label") }),
      ).getByText(message),
    ).toBeInTheDocument(),
  );
}

// Modal dialogs hide the rest of the page (toasts included) from assistive tech.
async function closeCollectionsDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: t("libraryWorkspace.close"),
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}

function getCheckbox(label: string) {
  return screen.getByRole("checkbox", { name: new RegExp(`^${label}\\d+$`) });
}beforeEach(() => {
  useApi(createFakeApi());
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("BookLibrary", () => {
  describe("library mode", () => {
    it("should show a loading status until the library has loaded", async () => {
      renderLibrary();

      expect(screen.getAllByRole("status").at(-1)).toHaveTextContent(
        t("libraryWorkspace.loadingLibrary"),
      );
      expect(
        await screen.findByRole("heading", { level: 3, name: "Dune" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("should render the library headings and every entry sorted by title", async () => {
      await renderLoadedLibrary();

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        t("libraryWorkspace.title"),
      );
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        t("libraryWorkspace.yourLibrary"),
      );
      expectEntryOrder(["Dune", "Emma", "Neuromancer"]);
      expect(getEntry("Dune")).toHaveTextContent("Frank Herbert");
      expect(getEntry("Dune")).toHaveTextContent(
        `412 ${t("libraryWorkspace.pages")} · Science Fiction`,
      );
    });

    it("should show an empty state linking to the search page when the library is empty", async () => {
      useApi(createFakeApi({ entries: [] }));
      await renderLoadedLibrary();

      expect(
        screen.getByText(t("libraryWorkspace.emptyLibrary")),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: t("libraryWorkspace.addBooks") }),
      ).toHaveAttribute("href", "/search");
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
    });

    it("should show the API error when the library fails to load", async () => {
      api.failNext("GET", "/api/library", {
        status: 500,
        error: "Database unavailable.",
      });
      renderLibrary();

      await expectToast("Database unavailable.");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: t("libraryWorkspace.manageCollections"),
        }),
      ).toBeDisabled();
    });

    it("should filter entries by title, author, category and ISBN while typing", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();
      const search = screen.getByRole("searchbox", {
        name: t("libraryWorkspace.searchLibrary"),
      });

      await user.type(search, "gibson");
      expectEntryOrder(["Neuromancer"]);

      await user.clear(search);
      await user.type(search, "science");
      expectEntryOrder(["Dune", "Neuromancer"]);

      await user.clear(search);
      await user.type(search, "978-0-14-143958-7");
      expectEntryOrder(["Emma"]);
    });

    it("should match Greek text regardless of accents", async () => {
      const user = userEvent.setup();
      const greekBook = makeEntry("entry-greek", {
        title: "Οι υπνοβάτες",
        authors: ["Όμηρος"],
        categories: ["Επική ποίηση"],
      });
      useApi(createFakeApi({ entries: [greekBook], collections: [] }));
      await renderLoadedLibrary();
      const search = screen.getByRole("searchbox", {
        name: t("libraryWorkspace.searchLibrary"),
      });

      await user.type(search, "υπνοβατ");
      expectEntryOrder(["Οι υπνοβάτες"]);

      await user.clear(search);
      await user.type(search, "όμηρος");
      expectEntryOrder(["Οι υπνοβάτες"]);
    });

    it("should show a no-match message when nothing matches the search", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.type(
        screen.getByRole("searchbox", {
          name: t("libraryWorkspace.searchLibrary"),
        }),
        "tolkien",
      );

      expect(screen.queryByRole("article")).not.toBeInTheDocument();
      expect(
        screen.getByText(t("libraryWorkspace.noBooksMatch")),
      ).toBeInTheDocument();
    });

    it("should reorder entries when a different sort is selected", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(
        screen.getByRole("radio", { name: t("libraryWorkspace.sortPageCount") }),
      );
      expectEntryOrder(["Emma", "Dune", "Neuromancer"]);

      await user.click(
        screen.getByRole("radio", { name: t("libraryWorkspace.sortDateAdded") }),
      );
      expectEntryOrder(["Emma", "Neuromancer", "Dune"]);

      await user.click(
        screen.getByRole("radio", { name: t("libraryWorkspace.sortRating") }),
      );
      expect(screen.getAllByRole("article")[0]).toHaveTextContent("Dune");
    });

    it("should show shelf counts and only the entries on the selected shelves", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      expect(getCheckbox(t("libraryWorkspace.shelfRead"))).toHaveAccessibleName(
        `${t("libraryWorkspace.shelfRead")}1`,
      );
      expect(
        getCheckbox(t("libraryWorkspace.shelfDidNotFinish")),
      ).toHaveAccessibleName(`${t("libraryWorkspace.shelfDidNotFinish")}0`);

      await user.click(getCheckbox(t("libraryWorkspace.shelfRead")));
      expectEntryOrder(["Dune"]);
      expect(getCheckbox(t("libraryWorkspace.shelfRead"))).toBeChecked();

      await user.click(getCheckbox(t("libraryWorkspace.shelfToRead")));
      expectEntryOrder(["Dune", "Emma"]);
    });

    it("should narrow the author options to books matching the other filters", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      expect(getCheckbox("Jane Austen")).toBeInTheDocument();

      await user.click(getCheckbox(t("libraryWorkspace.shelfRead")));

      expect(getCheckbox("Frank Herbert")).toBeInTheDocument();
      expect(
        screen.queryByRole("checkbox", { name: /^Jane Austen/ }),
      ).not.toBeInTheDocument();
    });

    it("should filter entries by author, category and collection", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(getCheckbox("Science Fiction"));
      expectEntryOrder(["Dune", "Neuromancer"]);

      await user.click(getCheckbox("William Gibson"));
      expectEntryOrder(["Neuromancer"]);

      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.reset") }),
      );
      expectEntryOrder(["Dune", "Emma", "Neuromancer"]);

      await user.click(getCheckbox(favourites.name));
      expectEntryOrder(["Emma"]);
    });

    it("should show a pill per selected filter and remove a single value from its pill", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(getCheckbox(t("libraryWorkspace.shelfRead")));
      await user.click(getCheckbox(t("libraryWorkspace.shelfToRead")));
      await user.click(
        screen.getByRole("radio", { name: t("libraryWorkspace.sortPageCount") }),
      );

      expect(
        screen.getByText(
          `${t("libraryWorkspace.sortBy")}: ${t("libraryWorkspace.sortPageCount")}`,
          { selector: "span" },
        ),
      ).toBeInTheDocument();
      expectEntryOrder(["Emma", "Dune"]);

      await user.click(
        screen.getByRole("button", {
          name: `${t("libraryWorkspace.remove")}: ${t("libraryWorkspace.shelfToRead")}`,
        }),
      );

      expectEntryOrder(["Dune"]);
      expect(getCheckbox(t("libraryWorkspace.shelfToRead"))).not.toBeChecked();
      expect(
        screen.queryByRole("button", {
          name: `${t("libraryWorkspace.remove")}: ${t("libraryWorkspace.shelfToRead")}`,
        }),
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", {
          name: `${t("libraryWorkspace.remove")}: ${t("libraryWorkspace.sortPageCount")}`,
        }),
      );
      expect(
        screen.getByRole("radio", { name: t("libraryWorkspace.sortTitle") }),
      ).toBeChecked();
    });

    it("should clear every filter and the sort from the clear filters pill", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(getCheckbox(t("libraryWorkspace.shelfRead")));
      await user.click(
        screen.getByRole("radio", { name: t("libraryWorkspace.sortRating") }),
      );
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.clearFilters") }),
      );

      expectEntryOrder(["Dune", "Emma", "Neuromancer"]);
      expect(
        screen.queryByRole("button", {
          name: t("libraryWorkspace.clearFilters"),
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: t("libraryWorkspace.reset") }),
      ).not.toBeInTheDocument();
    });

    it("should apply filters from the drawer and preview the result count", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.filter") }),
      );
      const drawer = await screen.findByRole("dialog", {
        name: t("libraryWorkspace.filter"),
      });
      await user.click(
        within(drawer).getByRole("checkbox", {
          name: new RegExp(`^${t("libraryWorkspace.shelfCurrentlyReading")}`),
        }),
      );
      expect(
        within(drawer).getByRole("button", {
          name: new RegExp(`^${t("libraryWorkspace.apply")}`),
        }),
      ).toHaveTextContent(`${t("libraryWorkspace.apply")}1`);

      await user.click(
        within(drawer).getByRole("button", {
          name: new RegExp(`^${t("libraryWorkspace.apply")}`),
        }),
      );

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expectEntryOrder(["Neuromancer"]);
      expect(
        screen.getByRole("button", { name: `${t("libraryWorkspace.filter")}1` }),
      ).toBeInTheDocument();
    });

    it("should apply filters passed in from the URL", async () => {
      await renderLoadedLibrary({
        initialFilters: { status: Shelf.Read, sort: "page-count", q: "" },
      });

      expectEntryOrder(["Dune"]);
      expect(getCheckbox(t("libraryWorkspace.shelfRead"))).toBeChecked();
      expect(
        screen.getByRole("radio", { name: t("libraryWorkspace.sortPageCount") }),
      ).toBeChecked();
    });

    it("should keep the URL in sync with the selected filters", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(getCheckbox(t("libraryWorkspace.shelfRead")));
      await user.type(
        screen.getByRole("searchbox", {
          name: t("libraryWorkspace.searchLibrary"),
        }),
        "dune",
      );

      await waitFor(() =>
        expect(window.location.search).toBe("?q=dune&status=read"),
      );
    });

    it("should restore filters from the URL on browser navigation", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(getCheckbox(t("libraryWorkspace.shelfRead")));
      expectEntryOrder(["Dune"]);

      window.history.replaceState(null, "", "/library?status=to-read");
      window.dispatchEvent(new PopStateEvent("popstate"));

      await waitFor(() => expectEntryOrder(["Emma"]));
      expect(getCheckbox(t("libraryWorkspace.shelfToRead"))).toBeChecked();
      expect(getCheckbox(t("libraryWorkspace.shelfRead"))).not.toBeChecked();
    });

    it("should save an edited review and keep it after reloading", async () => {
      const user = userEvent.setup();
      const view = await renderLoadedLibrary();
      const review = within(getEntry("Dune")).getByRole("textbox", {
        name: t("libraryWorkspace.review"),
      });

      await user.clear(review);
      await user.type(review, "A desert masterpiece.");
      await user.click(
        within(getEntry("Dune")).getByRole("button", {
          name: t("libraryWorkspace.save"),
        }),
      );

      await expectToast(t("libraryWorkspace.changesSaved"));

      view.unmount();
      await renderLoadedLibrary();
      expect(
        within(getEntry("Dune")).getByRole("textbox", {
          name: t("libraryWorkspace.review"),
        }),
      ).toHaveValue("A desert masterpiece.");
    });

    it("should move an entry to another shelf after changing its status and saving", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(
        within(getEntry("Emma")).getByRole("combobox", {
          name: t("libraryWorkspace.status"),
        }),
      );
      await user.click(
        await screen.findByRole("option", {
          name: t("libraryWorkspace.shelfRead"),
        }),
      );

      expect(getCheckbox(t("libraryWorkspace.shelfRead"))).toHaveAccessibleName(
        `${t("libraryWorkspace.shelfRead")}2`,
      );
      expect(
        within(getEntry("Emma")).getByRole("textbox", {
          name: t("libraryWorkspace.review"),
        }),
      ).toBeInTheDocument();

      await user.click(
        within(getEntry("Emma")).getByRole("button", {
          name: t("libraryWorkspace.save"),
        }),
      );
      await expectToast(t("libraryWorkspace.changesSaved"));

      await user.click(getCheckbox(t("libraryWorkspace.shelfRead")));
      expectEntryOrder(["Dune", "Emma"]);
    });

    it("should show the API error when saving an entry fails", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();
      api.failNext("PATCH", `/api/library/${dune.id}`, {
        status: 400,
        error: "Review must be 5,000 characters or fewer.",
      });

      await user.click(
        within(getEntry("Dune")).getByRole("button", {
          name: t("libraryWorkspace.save"),
        }),
      );

      await expectToast("Review must be 5,000 characters or fewer.");
      expect(
        within(getEntry("Dune")).getByRole("button", {
          name: t("libraryWorkspace.save"),
        }),
      ).toBeEnabled();
    });

    it("should keep the entry when removal is cancelled", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(
        within(getEntry("Emma")).getByRole("button", {
          name: t("libraryWorkspace.remove"),
        }),
      );
      const dialog = await screen.findByRole("alertdialog", {
        name: t("libraryWorkspace.removeTitle"),
      });
      expect(dialog).toHaveTextContent(
        t("libraryWorkspace.confirmRemove", { title: "Emma" }),
      );

      await user.click(
        within(dialog).getByRole("button", { name: t("libraryWorkspace.cancel") }),
      );

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expectEntryOrder(["Dune", "Emma", "Neuromancer"]);
    });

    it("should remove an entry after confirming", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(
        within(getEntry("Emma")).getByRole("button", {
          name: t("libraryWorkspace.remove"),
        }),
      );
      const dialog = await screen.findByRole("alertdialog", {
        name: t("libraryWorkspace.removeTitle"),
      });
      await user.click(
        within(dialog).getByRole("button", { name: t("libraryWorkspace.remove") }),
      );

      await expectToast(t("libraryWorkspace.bookRemoved"));
      expectEntryOrder(["Dune", "Neuromancer"]);
      expect(getCheckbox(t("libraryWorkspace.shelfToRead"))).toHaveAccessibleName(
        `${t("libraryWorkspace.shelfToRead")}0`,
      );
    });

    it("should keep the entry and show the API error when removal fails", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();
      api.failNext("DELETE", `/api/library/${emma.id}`, {
        status: 404,
        error: "Book not found.",
      });

      await user.click(
        within(getEntry("Emma")).getByRole("button", {
          name: t("libraryWorkspace.remove"),
        }),
      );
      await user.click(
        within(
          await screen.findByRole("alertdialog", {
            name: t("libraryWorkspace.removeTitle"),
          }),
        ).getByRole("button", { name: t("libraryWorkspace.remove") }),
      );

      await expectToast("Book not found.");
      expectEntryOrder(["Dune", "Emma", "Neuromancer"]);
    });

    it("should list collections in use as filters", async () => {
      await renderLoadedLibrary();

      expect(getCheckbox(favourites.name)).toHaveAccessibleName(
        `${favourites.name}1`,
      );
      expect(getCheckbox(sciFi.name)).toHaveAccessibleName(`${sciFi.name}1`);
    });

    it("should create a collection from the collections dialog", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(
        screen.getByRole("button", {
          name: t("libraryWorkspace.manageCollections"),
        }),
      );
      const dialog = await screen.findByRole("dialog", {
        name: t("libraryWorkspace.manageCollections"),
      });
      await user.type(
        within(dialog).getByRole("textbox", {
          name: t("libraryWorkspace.collectionName"),
        }),
        "Book club",
      );
      await user.click(
        within(dialog).getByRole("button", {
          name: t("libraryWorkspace.createCollection"),
        }),
      );

      expect(
        await within(dialog).findByRole("textbox", {
          name: t("libraryWorkspace.renameCollection", { name: "Book club" }),
        }),
      ).toHaveValue("Book club");

      await closeCollectionsDialog(user);
      await expectToast(t("libraryWorkspace.collectionCreated"));
    });

    it("should clear the collection filter and assignments when the filtered collection is deleted", async () => {
      const user = userEvent.setup();
      await renderLoadedLibrary();

      await user.click(getCheckbox(favourites.name));
      expectEntryOrder(["Emma"]);

      await user.click(
        screen.getByRole("button", {
          name: t("libraryWorkspace.manageCollections"),
        }),
      );
      const dialog = await screen.findByRole("dialog", {
        name: t("libraryWorkspace.manageCollections"),
      });
      await user.click(
        within(dialog).getByRole("button", {
          name: t("libraryWorkspace.deleteCollection", { name: favourites.name }),
        }),
      );
      const confirmation = within(dialog).getByRole("alertdialog");
      expect(confirmation).toHaveTextContent(
        t("libraryWorkspace.confirmDeleteCollection", { name: favourites.name }),
      );
      await user.click(
        within(confirmation).getByRole("button", {
          name: t("libraryWorkspace.deleteCollection", { name: favourites.name }),
        }),
      );

      await waitFor(() =>
        expect(within(dialog).queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      await closeCollectionsDialog(user);
      await expectToast(t("libraryWorkspace.collectionDeleted"));

      expectEntryOrder(["Dune", "Emma", "Neuromancer"]);
      expect(
        screen.queryByRole("checkbox", { name: new RegExp(`^${favourites.name}`) }),
      ).not.toBeInTheDocument();
      expect(
        within(getEntry("Emma")).getByRole("combobox", {
          name: t("libraryWorkspace.collection"),
        }),
      ).toHaveTextContent(t("libraryWorkspace.noCollection"));
    });
  });

  describe("search mode", () => {
    it("should render the catalog search form and manual add section", async () => {
      await renderSearch();

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        t("nav.searchLabel"),
      );
      expect(
        screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
      ).toHaveAttribute("placeholder", t("libraryWorkspace.searchPlaceholder"));
      expect(
        screen.getByRole("combobox", { name: t("libraryWorkspace.addToShelf") }),
      ).toHaveTextContent(t("libraryWorkspace.shelfToRead"));
      expect(
        screen.getByRole("combobox", {
          name: t("libraryWorkspace.addToCollection"),
        }),
      ).toHaveTextContent(t("libraryWorkspace.noCollection"));
      expect(screen.getByText(t("libraryWorkspace.manualAdd"))).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: t("libraryWorkspace.yourLibrary") }),
      ).not.toBeInTheDocument();
    });

    it("should show catalog results and mark books already in the library", async () => {
      const user = userEvent.setup();
      await renderSearch();

      await user.type(
        screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
        "dune",
      );
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.search") }),
      );

      const messiahResult = await findResult("Dune Messiah");
      expect(messiahResult).toHaveTextContent(
        `Frank Herbert · 256 ${t("libraryWorkspace.pages")} · Science Fiction, Space opera`,
      );
      expect(
        within(messiahResult).getByRole("button", {
          name: t("libraryWorkspace.addBook"),
        }),
      ).toBeEnabled();

      const duneResult = await findResult("Dune");
      expect(
        within(duneResult).getByRole("button", {
          name: t("libraryWorkspace.inLibrary"),
        }),
      ).toBeDisabled();
    });

    it("should add a catalog result to the library", async () => {
      const user = userEvent.setup();
      await renderSearch();

      await user.type(
        screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
        "messiah",
      );
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.search") }),
      );
      await user.click(
        within(await findResult("Dune Messiah")).getByRole("button", {
          name: t("libraryWorkspace.addBook"),
        }),
      );

      await expectToast(t("libraryWorkspace.bookAdded"));
      expect(
        within(await findResult("Dune Messiah")).getByRole("button", {
          name: t("libraryWorkspace.inLibrary"),
        }),
      ).toBeDisabled();
    });

    it("should run the initial query on load", async () => {
      await renderSearch({ initialQuery: "messiah" });

      expect(
        await screen.findByRole("heading", { level: 3, name: "Dune Messiah" }),
      ).toBeInTheDocument();
    });

    it("should tell the user when the catalog has no matches", async () => {
      const user = userEvent.setup();
      await renderSearch();

      await user.type(
        screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
        "zzzz",
      );
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.search") }),
      );

      await expectToast(t("libraryWorkspace.noSearchResults"));
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
    });

    it("should show the API error when the catalog search fails", async () => {
      const user = userEvent.setup();
      await renderSearch();

      await user.type(
        screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
        "d",
      );
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.search") }),
      );

      await expectToast("Enter at least 2 characters to search.");
    });

    it("should clear the results when the search box is emptied", async () => {
      const user = userEvent.setup();
      await renderSearch();
      const search = screen.getByRole("searchbox", {
        name: t("libraryWorkspace.searchBooks"),
      });

      await user.type(search, "dune");
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.search") }),
      );
      await screen.findByRole("heading", { level: 3, name: "Dune Messiah" });

      await user.clear(search);

      expect(screen.queryByRole("article")).not.toBeInTheDocument();
    });

    it("should show the API error when adding a book fails", async () => {
      const user = userEvent.setup();
      await renderSearch();
      api.failNext("POST", "/api/library", {
        status: 409,
        error: "This book is already in your library.",
      });

      await user.type(
        screen.getByRole("searchbox", { name: t("libraryWorkspace.searchBooks") }),
        "messiah",
      );
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.search") }),
      );
      await user.click(
        within(await findResult("Dune Messiah")).getByRole("button", {
          name: t("libraryWorkspace.addBook"),
        }),
      );

      await expectToast("This book is already in your library.");
      expect(
        within(await findResult("Dune Messiah")).getByRole("button", {
          name: t("libraryWorkspace.addBook"),
        }),
      ).toBeEnabled();
    });

    it("should add a book manually and reset the form", async () => {
      const user = userEvent.setup();
      await renderSearch();

      await user.click(screen.getByText(t("libraryWorkspace.manualAdd")));
      const title = screen.getByRole("textbox", {
        name: t("libraryWorkspace.titleField"),
      });
      await user.type(title, "The Left Hand of Darkness");
      await user.type(
        screen.getByRole("textbox", { name: t("libraryWorkspace.author") }),
        "Ursula K. Le Guin",
      );
      await user.type(
        screen.getByRole("textbox", { name: t("libraryWorkspace.isbn") }),
        "9780441478125",
      );
      await user.type(
        screen.getByRole("spinbutton", { name: t("libraryWorkspace.pages") }),
        "304",
      );
      await user.type(
        screen.getByRole("textbox", { name: t("libraryWorkspace.categories") }),
        "Science Fiction, Classics",
      );
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.addBook") }),
      );

      await expectToast(t("libraryWorkspace.bookAdded"));
      expect(title).toHaveValue("");
      expect(
        screen.getByRole("textbox", { name: t("libraryWorkspace.author") }),
      ).toHaveValue("");
    });

    it("should not add a manual book whose ISBN is already in the library", async () => {
      const user = userEvent.setup();
      await renderSearch();

      await user.click(screen.getByText(t("libraryWorkspace.manualAdd")));
      const title = screen.getByRole("textbox", {
        name: t("libraryWorkspace.titleField"),
      });
      await user.type(title, "Dune (paperback)");
      await user.type(
        screen.getByRole("textbox", { name: t("libraryWorkspace.isbn") }),
        "978-0441013593",
      );
      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.addBook") }),
      );

      await expectToast(t("libraryWorkspace.inLibrary"));
      expect(title).toHaveValue("Dune (paperback)");
    });

    it("should explain that barcode scanning is unsupported without camera APIs", async () => {
      const user = userEvent.setup();
      await renderSearch();

      await user.click(
        screen.getByRole("button", { name: t("libraryWorkspace.scanBarcode") }),
      );

      await expectToast(t("libraryWorkspace.scannerUnsupported"));
      expect(
        screen.queryByRole("button", { name: t("libraryWorkspace.stopScan") }),
      ).not.toBeInTheDocument();
    });
  });
});
