import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import CatalogBookForm from "./catalog-book-form";

const DUPLICATE_ERROR = "A book with this ISBN is already in our catalog.";

function stubCatalogApi(savedIsbns: string[] = []) {
  const storedIsbns = new Set(savedIsbns);
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) !== "/api/admin/books" || init?.method !== "POST") {
      return Response.json({ error: "Not found." }, { status: 404 });
    }
    const book = JSON.parse(String(init.body)) as { isbn?: string };
    if (book.isbn && storedIsbns.has(book.isbn)) {
      return Response.json({ error: DUPLICATE_ERROR }, { status: 409 });
    }
    if (book.isbn) storedIsbns.add(book.isbn);
    return Response.json({ id: "1" }, { status: 201 });
  });
}

function renderForm() {
  renderWithIntl(
    <ToastProvider>
      <CatalogBookForm />
    </ToastProvider>,
  );
}

async function submitBook(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: t("libraryWorkspace.titleField") }),
    "Η Ζωή εν τάφω",
  );
  await user.type(
    screen.getByRole("textbox", { name: t("libraryWorkspace.isbn") }),
    "9789600316117",
  );
  await user.click(
    screen.getByRole("button", { name: t("catalogBookAdd.save") }),
  );
}

function notifications() {
  return within(screen.getByRole("region", { name: t("notifications.label") }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CatalogBookForm", () => {
  it("should save the book to the catalog and clear the form", async () => {
    const user = userEvent.setup();
    stubCatalogApi();
    renderForm();

    await submitBook(user);

    await waitFor(() =>
      expect(notifications().getByText(t("catalogBookAdd.saved"))).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("textbox", { name: t("libraryWorkspace.titleField") }),
    ).toHaveValue("");
  });

  it("should show the error and keep the details when the ISBN is already stored", async () => {
    const user = userEvent.setup();
    stubCatalogApi(["9789600316117"]);
    renderForm();

    await submitBook(user);
    await waitFor(() =>
      expect(notifications().getByText(DUPLICATE_ERROR)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("textbox", { name: t("libraryWorkspace.titleField") }),
    ).toHaveValue("Η Ζωή εν τάφω");
  });
});
