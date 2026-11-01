"use client";

import Link from "@/components/navigation-link/navigation-link";
import { BookOpen, Library, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import BookEntry from "@/components/book-entry/book-entry";
import CollectionsDialog from "@/components/book-library/collections-dialog/collections-dialog";
import EmptyState from "@/components/book-library/empty-state/empty-state";
import { filterDefaults } from "@/components/book-library/filter-utils";
import LibraryFiltersDrawer from "@/components/book-library/library-filters-drawer/library-filters-drawer";
import LibraryFiltersSidebar from "@/components/book-library/library-filters-sidebar/library-filters-sidebar";
import SelectedFiltersPills from "@/components/book-library/selected-filters-pills/selected-filters-pills";
import TextInput from "@/components/text-input/text-input";
import styles from "./library-panel.module.css";
import type { LibraryPanelProps } from "./library-panel.types";
import { useLibraryFilters } from "./use-library-filters";

export default function LibraryPanel({
  entries,
  collections,
  libraryLoaded,
  libraryLoadFailed,
  initialFilters,
  shelfNames,
  entryLabels,
  busyId,
  onEntryChange,
  onEntrySave,
  onEntryRemove,
  onCollectionsChange,
  onCollectionDeleted,
}: LibraryPanelProps) {
  const t = useTranslations("libraryWorkspace");
  const {
    libraryQuery,
    setLibraryQuery,
    visibleEntries,
    filterValues,
    filterSections,
    applyFilters,
    getFilteredResultCount,
    removeFilter,
    removeFilterValue,
    clearCollectionFilter,
  } = useLibraryFilters({ entries, collections, shelfNames, initialFilters });

  return (
    <section
      className={styles.panel}
      aria-labelledby="library-heading"
    >
      <div className={styles.libraryHeader}>
        <h2 className={styles.sectionTitle} id="library-heading">
          <Library aria-hidden="true" />
          {t("yourLibrary")}
        </h2>
        <CollectionsDialog
          collections={collections}
          onChange={onCollectionsChange}
          disabled={!libraryLoaded}
          onDeleted={(id) => {
            clearCollectionFilter(id);
            onCollectionDeleted(id);
          }}
        />
      </div>
      <div className={styles.libraryLayout}>
        <LibraryFiltersSidebar
          values={filterValues}
          defaults={filterDefaults}
          sections={filterSections}
          onChange={(key, value) =>
            applyFilters({ ...filterValues, [key]: value })
          }
          onClear={() => applyFilters(filterDefaults)}
        />
        <div className={styles.libraryContent}>
          <TextInput
            label={t("searchLibrary")}
            fieldClassName={styles.field}
            type="search"
            value={libraryQuery}
            placeholder={t("librarySearchPlaceholder")}
            onChange={(event) => setLibraryQuery(event.target.value)}
          />
          <LibraryFiltersDrawer
            disabled={!libraryLoaded}
            values={filterValues}
            defaults={filterDefaults}
            sections={filterSections}
            onApply={applyFilters}
            resultCount={visibleEntries.length}
            getResultCount={getFilteredResultCount}
          />
          <SelectedFiltersPills
            values={filterValues}
            defaults={filterDefaults}
            sections={filterSections}
            onRemoveFilter={removeFilter}
            onRemoveFilterValue={removeFilterValue}
            onClearAll={() => applyFilters(filterDefaults)}
          />
          {!libraryLoaded ? (
            !libraryLoadFailed && <p role="status">{t("loadingLibrary")}</p>
          ) : entries.length ? (
            <div className={styles.entries}>
              {visibleEntries.map((entry) => (
                <BookEntry
                  key={entry.id}
                  entry={entry}
                  collections={collections}
                  shelfNames={shelfNames}
                  labels={entryLabels}
                  onChange={onEntryChange}
                  onSave={onEntrySave}
                  onRemove={onEntryRemove}
                  busy={busyId === entry.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={<BookOpen aria-hidden="true" />}>
              {t("emptyLibrary")}
              <br />
              <Link href="/search">
                <strong>{t("addBooks")}</strong>
              </Link>
            </EmptyState>
          )}
          {!!entries.length && !visibleEntries.length && (
            <EmptyState icon={<Search aria-hidden="true" />}>
              {t("noBooksMatch")}
            </EmptyState>
          )}
        </div>
      </div>
    </section>
  );
}
