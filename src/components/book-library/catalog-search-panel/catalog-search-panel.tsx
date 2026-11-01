"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus, ScanBarcode, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import BookCover from "@/components/book-cover/book-cover";
import Button from "@/components/button/button";
import Dropdown from "@/components/dropdown/dropdown";
import TextInput from "@/components/text-input/text-input";
import { normalizeIsbn } from "@/components/book-library/filter-utils";
import { toCollectionOptions } from "@/lib/collections";
import { BookSource } from "@/lib/book-source";
import { fetchJson, getErrorMessage } from "@/lib/fetch-json";
import type { NewBook } from "@/lib/open-library";
import { SHELVES, Shelf, isShelf } from "@/lib/shelves";
import styles from "./catalog-search-panel.module.css";
import type { CatalogSearchPanelProps } from "./catalog-search-panel.types";
import { useBarcodeScanner } from "./use-barcode-scanner";

type SearchResponse = { results: NewBook[] };

async function fetchSearchResults(searchTerm: string) {
  const params = new URLSearchParams({ q: searchTerm });
  const data = await fetchJson<SearchResponse>(`/api/books/search?${params}`);
  return data.results;
}

export default function CatalogSearchPanel({
  initialQuery,
  entries,
  collections,
  libraryLoaded,
  shelfNames,
  onBookAdded,
}: CatalogSearchPanelProps) {
  const t = useTranslations("libraryWorkspace");
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<NewBook[]>([]);
  const [searchShelf, setSearchShelf] = useState(Shelf.ToRead);
  const [searchCollection, setSearchCollection] = useState("");
  const [busy, setBusy] = useState(false);

  const showResults = useCallback(
    (found: NewBook[]) => {
      setResults(found);
      if (!found.length) toast.info(t("noSearchResults"));
    },
    [t],
  );

  const announceError = useCallback(
    (reason: unknown) => {
      toast.error(getErrorMessage(reason, t("genericError")));
    },
    [t],
  );

  async function searchCatalog(searchTerm: string) {
    setBusy(true);
    try {
      showResults(await fetchSearchResults(searchTerm));
    } catch (reason) {
      announceError(reason);
    } finally {
      setBusy(false);
    }
  }

  const { videoRef, scanRunning, startScanner, stopScanner } =
    useBarcodeScanner(async (isbn) => {
      setQuery(isbn);
      await searchCatalog(isbn);
    });

  useEffect(() => {
    if (initialQuery.trim().length < 2) return;
    let active = true;
    fetchSearchResults(initialQuery)
      .then((found) => active && showResults(found))
      .catch((reason: unknown) => active && announceError(reason));
    return () => {
      active = false;
    };
  }, [announceError, initialQuery, showResults]);

  function isInLibrary(book: NewBook) {
    return entries.some(
      (entry) =>
        (book.externalId &&
          entry.book.source === book.source &&
          entry.book.externalId === book.externalId) ||
        (book.isbn &&
          normalizeIsbn(book.isbn) === normalizeIsbn(entry.book.isbn ?? "")),
    );
  }

  async function addBook(book: NewBook): Promise<boolean> {
    if (isInLibrary(book)) {
      toast.info(t("inLibrary"));
      return false;
    }
    setBusy(true);
    try {
      await fetchJson("/api/library", {
        method: "POST",
        json: {
          book,
          status: searchShelf,
          collectionIds: searchCollection ? [searchCollection] : [],
        },
      });
      await onBookAdded();
      toast.success(t("bookAdded"));
      return true;
    } catch (reason) {
      announceError(reason);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createManualBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const author = String(form.get("author") ?? "").trim();
    const book: NewBook = {
      source: BookSource.Manual,
      title: String(form.get("title") ?? "").trim(),
      authors: author ? [author] : [],
      isbn: String(form.get("isbn") ?? "").trim() || undefined,
      pageCount: Number(form.get("pageCount") ?? 0) || 0,
      categories: String(form.get("categories") ?? "")
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean),
      coverUrl: String(form.get("coverUrl") ?? "").trim() || undefined,
    };
    if (await addBook(book)) formElement.reset();
  }

  return (
    <section className={styles.panel} aria-labelledby="catalog-heading">
      <h2 className={styles.sectionTitle} id="catalog-heading">
        <Search aria-hidden="true" />
        {t("addBooks")}
      </h2>
      <form
        className={styles.searchForm}
        onSubmit={(event) => {
          event.preventDefault();
          void searchCatalog(query);
        }}
      >
        <TextInput
          label={t("searchBooks")}
          fieldClassName={styles.field}
          type="search"
          value={query}
          onChange={(event) => {
            const newValue = event.target.value;
            setQuery(newValue);
            if (newValue.trim().length === 0) setResults([]);
          }}
          placeholder={t("searchPlaceholder")}
        />
        <Button type="submit" loading={busy}>
          <Search aria-hidden="true" />
          {t("search")}
        </Button>
        {scanRunning ? (
          <Button variant="secondary" onClick={stopScanner}>
            <ScanBarcode aria-hidden="true" />
            {t("stopScan")}
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => void startScanner()}>
            <ScanBarcode aria-hidden="true" />
            {t("scanBarcode")}
          </Button>
        )}
      </form>
      <video
        ref={videoRef}
        className={scanRunning ? styles.scannerVideo : styles.hidden}
        muted
        playsInline
      />
      <div className={styles.row}>
        <Dropdown
          label={t("addToShelf")}
          fieldClassName={styles.field}
          value={searchShelf}
          onValueChange={(value) => {
            if (isShelf(value)) setSearchShelf(value);
          }}
          options={SHELVES.map((shelf) => ({
            value: shelf,
            label: shelfNames[shelf],
          }))}
        />
        <Dropdown
          label={t("addToCollection")}
          fieldClassName={styles.field}
          value={searchCollection}
          onValueChange={setSearchCollection}
          options={toCollectionOptions(collections, t("noCollection"))}
        />
      </div>
      {!!results.length && (
        <div className={styles.results}>
          {results.map((book) => {
            const inLibrary = isInLibrary(book);
            return (
              <article className={styles.result} key={book.externalId}>
                <BookCover className={styles.cover} src={book.coverUrl} />
                <div>
                  <h3 className={styles.title}>{book.title}</h3>
                  <p className={styles.details}>
                    {book.authors.join(", ") || t("noAuthor")}
                    {book.pageCount ? ` · ${book.pageCount} ${t("pages")}` : ""}
                    {book.categories.length
                      ? ` · ${book.categories.slice(0, 2).join(", ")}`
                      : ""}
                  </p>
                  <Button
                    className={styles.addButton}
                    disabled={busy || !libraryLoaded || inLibrary}
                    onClick={() => void addBook(book)}
                  >
                    {inLibrary ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Plus aria-hidden="true" />
                    )}
                    {inLibrary ? t("inLibrary") : t("addBook")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <details className={styles.manualDetails}>
        <summary>{t("manualAdd")}</summary>
        <form
          className={styles.manualForm}
          onSubmit={(event) => void createManualBook(event)}
        >
          <TextInput
            label={t("titleField")}
            fieldClassName={styles.field}
            name="title"
            required
            maxLength={300}
          />
          <TextInput
            label={t("author")}
            fieldClassName={styles.field}
            name="author"
          />
          <TextInput
            label={t("isbn")}
            fieldClassName={styles.field}
            name="isbn"
          />
          <TextInput
            label={t("pages")}
            fieldClassName={styles.field}
            name="pageCount"
            type="number"
            min="0"
            step="1"
          />
          <TextInput
            label={t("categories")}
            fieldClassName={styles.field}
            name="categories"
            placeholder={t("categoryHint")}
          />
          <TextInput
            label={t("coverUrl")}
            fieldClassName={styles.field}
            name="coverUrl"
            type="url"
          />
          <Button type="submit" disabled={busy || !libraryLoaded}>
            {t("addBook")}
          </Button>
        </form>
      </details>
    </section>
  );
}
