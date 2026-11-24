import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  View,
} from "react-native";
import { ChevronDown, SlidersHorizontal, Trash2, X } from "lucide-react-native";
import { LocalizedText as Text } from "../../components/localized-text";
import { AppButton } from "../../components/app-button";
import { BookCard } from "../../components/book-card";
import { EmptyState } from "../../components/empty-state";
import { LoadingState } from "../../components/loading-state";
import { LibraryFiltersDrawer } from "../../components/library-filters-drawer/library-filters-drawer";
import { Notice } from "../../components/notice";
import { Panel } from "../../components/panel";
import { Screen } from "../../components/screen";
import { TextField } from "../../components/text-field";
import { LibrarySort, shelves } from "../../lib/types";
import {
  createEmptyLibraryFilters,
  getLibraryFilterResults,
  type LibraryFilterOption,
  type LibraryFilterSectionKey,
} from "../../lib/library-filters";
import { radius, spacing, type ThemeColors } from "../../lib/theme";
import { useLibrary } from "../../hooks/use-library";
import { useThemedStyles } from "../../lib/use-themed-styles";
import { usePreferences } from "../../providers/preferences-provider";
import {
  getShelfMessageKey,
  translateMessage,
  type MobileMessageKey,
} from "../../lib/translation";

const sortOptions = [
  { value: LibrarySort.Title, messageKey: "mobile.library.sortTitle" },
  { value: LibrarySort.Author, messageKey: "mobile.library.sortAuthor" },
  { value: LibrarySort.Rating, messageKey: "mobile.library.sortRating" },
  { value: LibrarySort.PageCount, messageKey: "mobile.library.sortPageCount" },
  { value: LibrarySort.DateAdded, messageKey: "mobile.library.sortDateAdded" },
] as const;

const sortMessageKeys: Record<LibrarySort, MobileMessageKey> = {
  [LibrarySort.Title]: "mobile.library.sortTitle",
  [LibrarySort.Author]: "mobile.library.sortAuthor",
  [LibrarySort.Rating]: "mobile.library.sortRating",
  [LibrarySort.PageCount]: "mobile.library.sortPageCount",
  [LibrarySort.DateAdded]: "mobile.library.sortDateAdded",
};

export default function LibraryScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors, locale } = usePreferences();
  const { entries, collections, isLoading, error } = useLibrary();
  const [filters, setFilters] = useState(createEmptyLibraryFilters);
  const [draftFilters, setDraftFilters] = useState(createEmptyLibraryFilters);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<LibraryFilterSectionKey>("shelf");
  const [query, setQuery] = useState("");

  const appliedResults = useMemo(
    () => getLibraryFilterResults(entries, collections, filters, query),
    [collections, entries, filters, query],
  );
  const draftResultCount = useMemo(
    () =>
      filterSheetVisible
        ? getLibraryFilterResults(entries, collections, draftFilters, query)
            .visibleEntries.length
        : appliedResults.visibleEntries.length,
    [
      appliedResults.visibleEntries.length,
      collections,
      draftFilters,
      entries,
      filterSheetVisible,
      query,
    ],
  );
  const filterSections: {
    key: LibraryFilterSectionKey;
    labelKey: MobileMessageKey;
  }[] = [
    { key: "sortBy", labelKey: "mobile.library.sortBy" },
    { key: "shelf", labelKey: "mobile.library.status" },
    { key: "author", labelKey: "mobile.library.author" },
    { key: "category", labelKey: "mobile.library.category" },
    { key: "collection", labelKey: "mobile.library.collection" },
  ];
  const optionsBySection: Record<LibraryFilterSectionKey, LibraryFilterOption[]> = {
    sortBy: sortOptions.map(({ value, messageKey }) => ({
      value,
      label: translateMessage(messageKey, locale),
    })),
    shelf: appliedResults.shelfOptions.map((option) => ({
      ...option,
      label: translateMessage(getShelfMessageKey(option.value), locale),
    })),
    author: appliedResults.authorOptions,
    category: appliedResults.categoryOptions,
    collection: appliedResults.collectionOptions,
  };
  const activeFilterCount = [
    filters.shelves,
    filters.authors,
    filters.categories,
    filters.collectionIds,
  ].filter((values) => values.length > 0).length;
  const sortChanged = filters.sortBy !== LibrarySort.Title;
  const selectedFilterChips: {
    section: LibraryFilterSectionKey;
    value: string;
    label: string;
  }[] = [
    ...filters.shelves.map((shelf) => ({
      section: "shelf" as const,
      value: shelf,
      label: translateMessage(getShelfMessageKey(shelf), locale),
    })),
    ...filters.authors.map((author) => ({
      section: "author" as const,
      value: author,
      label: author,
    })),
    ...filters.categories.map((category) => ({
      section: "category" as const,
      value: category,
      label: category,
    })),
    ...filters.collectionIds.map((id) => ({
      section: "collection" as const,
      value: id,
      label: collections.find((collection) => collection.id === id)?.name ?? id,
    })),
    ...(sortChanged
      ? [{
          section: "sortBy" as const,
          value: filters.sortBy,
          label: `${translateMessage("mobile.library.sortBy", locale)}: ${translateMessage(
            sortMessageKeys[filters.sortBy],
            locale,
          )}`,
        }]
      : []),
  ];

  if (isLoading) return <LoadingState />;

  function openFilters(section: LibraryFilterSectionKey) {
    setDraftFilters(filters);
    setActiveSection(section);
    setFilterSheetVisible(true);
  }

  function toggleDraftOption(section: LibraryFilterSectionKey, value: string) {
    setDraftFilters((previous) => {
      if (section === "sortBy") {
        const sort = Object.values(LibrarySort).find((item) => item === value);
        return sort ? { ...previous, sortBy: sort } : previous;
      }

      const toggle = <T extends string>(values: T[], selectedValue: T) =>
        values.includes(selectedValue)
          ? values.filter((item) => item !== selectedValue)
          : [...values, selectedValue];
      switch (section) {
        case "shelf": {
          const shelf = shelves.find((item) => item === value);
          return shelf
            ? { ...previous, shelves: toggle(previous.shelves, shelf) }
            : previous;
        }
        case "author":
          return { ...previous, authors: toggle(previous.authors, value) };
        case "category":
          return { ...previous, categories: toggle(previous.categories, value) };
        case "collection":
          return { ...previous, collectionIds: toggle(previous.collectionIds, value) };
        default:
          return previous;
      }
    });
  }

  function removeFilterChip(section: LibraryFilterSectionKey, value: string) {
    setFilters((previous) => {
      switch (section) {
        case "sortBy":
          return { ...previous, sortBy: LibrarySort.Title };
        case "shelf":
          return { ...previous, shelves: previous.shelves.filter((item) => item !== value) };
        case "author":
          return { ...previous, authors: previous.authors.filter((item) => item !== value) };
        case "category":
          return { ...previous, categories: previous.categories.filter((item) => item !== value) };
        case "collection":
          return { ...previous, collectionIds: previous.collectionIds.filter((item) => item !== value) };
      }
    });
  }

  function clearFilters() {
    setFilters(createEmptyLibraryFilters());
  }

  return (
    <Screen
      bottomNavigation
      titleKey="mobile.library.title"
      subtitleKey="mobile.library.booksOnShelves"
      subtitleValues={{ count: entries.length }}
    >
      {error ? <Notice message={error} /> : null}
      <AppButton
        label="mobile.library.manageCollections"
        onPress={() => router.push("/collections")}
        variant="outline"
      />
      <TextField
        autoCapitalize="none"
        label="mobile.library.search"
        onChangeText={setQuery}
        placeholder="mobile.library.searchPlaceholder"
        value={query}
      />
      <View style={styles.filterControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: activeFilterCount > 0 }}
          onPress={() => openFilters("shelf")}
          style={[styles.filterPill, activeFilterCount > 0 && styles.filterPillActive]}
        >
          <SlidersHorizontal color={activeFilterCount ? colors.primary : colors.text} size={16} />
          <NativeText style={styles.filterPillText}>
            {translateMessage("mobile.library.filter", locale)}
          </NativeText>
          {activeFilterCount > 0 ? (
            <View style={styles.filterCountBadge}>
              <NativeText style={styles.filterCountText}>{activeFilterCount}</NativeText>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: sortChanged }}
          onPress={() => openFilters("sortBy")}
          style={[styles.filterPill, sortChanged && styles.filterPillActive]}
        >
          <NativeText numberOfLines={1} style={styles.filterPillText}>
            {sortChanged
              ? `${translateMessage("mobile.library.sortBy", locale)}: ${
                  translateMessage(sortMessageKeys[filters.sortBy], locale)
                }`
              : translateMessage("mobile.library.sortBy", locale)}
          </NativeText>
          <ChevronDown color={colors.muted} size={16} />
        </Pressable>
      </View>
      {selectedFilterChips.length ? (
        <ScrollView
          contentContainerStyle={styles.selectedFiltersContent}
          horizontal
          showsHorizontalScrollIndicator
          style={styles.selectedFilters}
        >
          {selectedFilterChips.map((chip) => (
            <Pressable
              accessibilityLabel={translateMessage("mobile.library.removeFilter", locale, {
                label: chip.label,
              })}
              accessibilityRole="button"
              key={`${chip.section}-${chip.value}`}
              onPress={() => removeFilterChip(chip.section, chip.value)}
              style={styles.selectedFilterChip}
            >
              <NativeText numberOfLines={1} style={styles.selectedFilterText}>
                {chip.label}
              </NativeText>
              <X color={colors.muted} size={14} />
            </Pressable>
          ))}
          <Pressable
            accessibilityLabel={translateMessage("mobile.library.clearFilters", locale)}
            accessibilityRole="button"
            onPress={clearFilters}
            style={styles.clearFiltersChip}
          >
            <Trash2 color={colors.text} size={14} />
            <NativeText style={styles.clearFiltersText}>
              {translateMessage("mobile.library.clearFilters", locale)}
            </NativeText>
          </Pressable>
        </ScrollView>
      ) : null}
      <Text style={styles.count}>
        {appliedResults.visibleEntries.length}{" "}
        {translateMessage(
          appliedResults.visibleEntries.length === 1
            ? "mobile.common.book"
            : "mobile.common.books",
          locale,
        )}
      </Text>
      {appliedResults.visibleEntries.length ? (
        appliedResults.visibleEntries.map((entry) => (
          <BookCard
            book={entry.book}
            currentPage={entry.currentPage}
            key={entry.id}
            rating={entry.rating}
            status={entry.status}
            onPress={() =>
              router.push({ pathname: "/book/[id]", params: { id: entry.id } })
            }
          />
        ))
      ) : (
        <Panel>
          <EmptyState
            titleKey={
              entries.length
                ? "mobile.library.noBooksMatch"
                : "mobile.library.emptyTitle"
            }
            descriptionKey={
              entries.length
                ? "mobile.library.tryDifferentFilter"
                : "mobile.library.emptyDescription"
            }
          />
        </Panel>
      )}
      <LibraryFiltersDrawer
        activeSection={activeSection}
        draftFilters={draftFilters}
        onApply={() => {
          setFilters(draftFilters);
          setFilterSheetVisible(false);
        }}
        onClear={() => setDraftFilters(createEmptyLibraryFilters())}
        onClose={() => setFilterSheetVisible(false)}
        onSectionChange={setActiveSection}
        onToggleOption={toggleDraftOption}
        optionsBySection={optionsBySection}
        resultCount={draftResultCount}
        sections={filterSections}
        visible={filterSheetVisible}
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  filterControls: { flexDirection: "row", gap: spacing.sm },
  filterPill: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  filterPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterPillText: { flexShrink: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
  filterCountBadge: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  filterCountText: { color: colors.primaryContrast, fontSize: 11, fontWeight: "700" },
  selectedFilters: { flexGrow: 0 },
  selectedFiltersContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectedFilterChip: {
    maxWidth: "100%",
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  selectedFilterText: { maxWidth: 200, color: colors.text, fontSize: 12, fontWeight: "600" },
  clearFiltersChip: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  clearFiltersText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  count: { color: colors.muted, fontSize: 13, fontWeight: "600", marginTop: spacing.xs },
});
