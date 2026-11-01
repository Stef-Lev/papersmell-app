"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RouteLoading from "@/components/route-loading/route-loading";
import { Library, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import CatalogSearchPanel from "@/components/book-library/catalog-search-panel/catalog-search-panel";
import LibraryPanel from "@/components/book-library/library-panel/library-panel";
import type {
  BookCollection,
  BookEntryData,
} from "@/components/book-entry/book-entry.types";
import { fetchJson, getErrorMessage } from "@/lib/fetch-json";
import { LibraryMode } from "@/lib/library";
import { Shelf } from "@/lib/shelves";
import styles from "./book-library.module.css";
import type { BookLibraryProps } from "./book-library.types";

type LibraryResponse = {
  entries: BookEntryData[];
  collections: BookCollection[];
};

function fetchLibrary() {
  return fetchJson<LibraryResponse>("/api/library");
}

export default function BookLibrary({
  mode,
  initialQuery = "",
  initialFilters = {},
}: BookLibraryProps) {
  const t = useTranslations("libraryWorkspace");
  const nav = useTranslations("nav");
  const isSearch = mode === LibraryMode.Search;
  const [entries, setEntries] = useState<BookEntryData[]>([]);
  const [collections, setCollections] = useState<BookCollection[]>([]);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [libraryLoadFailed, setLibraryLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState("");

  const announceError = useCallback(
    (reason: unknown, fallback = t("genericError")) => {
      toast.error(getErrorMessage(reason, fallback));
    },
    [t],
  );

  const reloadEntries = useCallback(async () => {
    setEntries((await fetchLibrary()).entries);
  }, []);

  useEffect(() => {
    let active = true;
    fetchLibrary()
      .then((data) => {
        if (!active) return;
        setEntries(data.entries);
        setCollections(data.collections);
        setLibraryLoaded(true);
        setLibraryLoadFailed(false);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setLibraryLoadFailed(true);
        announceError(reason, t("loadError"));
      });
    return () => {
      active = false;
    };
  }, [announceError, t]);

  const shelfNames: Record<Shelf, string> = useMemo(
    () => ({
      [Shelf.ToRead]: t("shelfToRead"),
      [Shelf.CurrentlyReading]: t("shelfCurrentlyReading"),
      [Shelf.Read]: t("shelfRead"),
      [Shelf.DidNotFinish]: t("shelfDidNotFinish"),
    }),
    [t],
  );

  const entryLabels = useMemo(
    () => ({
      author: t("author"),
      noAuthor: t("noAuthor"),
      rating: t("rating"),
      noRating: t("noRating"),
      review: t("review"),
      startedAt: t("startedAt"),
      finishedAt: t("finishedAt"),
      status: t("status"),
      collection: t("collection"),
      noCollection: t("noCollection"),
      save: t("save"),
      remove: t("remove"),
      removeTitle: t("removeTitle"),
      confirmRemove: (title: string) => t("confirmRemove", { title }),
      cancel: t("cancel"),
      saving: t("saving"),
      pages: t("pages"),
      editBookDetails: t("editBookDetails"),
      title: t("title"),
      authors: t("authors"),
      isbn: t("isbn"),
      pageCount: t("pageCount"),
      coverUrl: t("coverUrl"),
      addAuthor: t("addAuthor"),
      close: t("close"),
    }),
    [t],
  );

  const handleEntryChange = useCallback(
    (id: string, changes: Partial<BookEntryData>) => {
      setEntries((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      );
    },
    [],
  );

  const handleEntrySave = useCallback(
    async (entry: BookEntryData) => {
      setBusyId(entry.id);
      try {
        await fetchJson(`/api/library/${entry.id}`, {
          method: "PATCH",
          json: {
            status: entry.status,
            rating: entry.rating,
            review: entry.review,
            startedAt: entry.startedAt,
            finishedAt: entry.finishedAt,
            collectionIds: entry.collectionIds,
          },
        });
        await reloadEntries();
        toast.success(t("changesSaved"));
      } catch (reason) {
        announceError(reason);
      } finally {
        setBusyId("");
      }
    },
    [announceError, reloadEntries, t],
  );

  const handleEntryRemove = useCallback(
    async (entry: BookEntryData) => {
      setBusyId(entry.id);
      try {
        await fetchJson(`/api/library/${entry.id}`, { method: "DELETE" });
        setEntries((previous) =>
          previous.filter((item) => item.id !== entry.id),
        );
        toast.success(t("bookRemoved"));
      } catch (reason) {
        announceError(reason);
      } finally {
        setBusyId("");
      }
    },
    [announceError, t],
  );

  const handleCollectionDeleted = useCallback((id: string) => {
    setEntries((previous) =>
      previous.map((entry) => ({
        ...entry,
        collectionIds: entry.collectionIds.filter(
          (collectionId) => collectionId !== id,
        ),
      })),
    );
  }, []);

  return (
    <main className={styles.main}>
      {!libraryLoaded && !libraryLoadFailed && <RouteLoading />}
      <section className={styles.hero}>
        <span className={styles.heroIcon}>
          {isSearch ? (
            <Search aria-hidden="true" />
          ) : (
            <Library aria-hidden="true" />
          )}
        </span>
        <div>
          <h1 className={styles.heading}>
            {isSearch ? nav("searchLabel") : t("title")}
          </h1>
        </div>
      </section>

      {isSearch ? (
        <CatalogSearchPanel
          initialQuery={initialQuery}
          entries={entries}
          collections={collections}
          libraryLoaded={libraryLoaded}
          shelfNames={shelfNames}
          onBookAdded={reloadEntries}
        />
      ) : (
        <LibraryPanel
          entries={entries}
          collections={collections}
          libraryLoaded={libraryLoaded}
          libraryLoadFailed={libraryLoadFailed}
          initialFilters={initialFilters}
          shelfNames={shelfNames}
          entryLabels={entryLabels}
          busyId={busyId}
          onEntryChange={handleEntryChange}
          onEntrySave={(entry) => void handleEntrySave(entry)}
          onEntryRemove={(entry) => void handleEntryRemove(entry)}
          onCollectionsChange={setCollections}
          onCollectionDeleted={handleCollectionDeleted}
        />
      )}
    </main>
  );
}
