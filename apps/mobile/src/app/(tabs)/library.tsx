import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "../../components/localized-text";
import { AppButton } from "../../components/app-button";
import { BookCard } from "../../components/book-card";
import { EmptyState } from "../../components/empty-state";
import { LoadingState } from "../../components/loading-state";
import { Notice } from "../../components/notice";
import { OptionSelector } from "../../components/option-selector";
import { Panel } from "../../components/panel";
import { Screen } from "../../components/screen";
import { ShelfSelector } from "../../components/shelf-selector";
import { TextField } from "../../components/text-field";
import { LibrarySort, shelves, type Shelf } from "../../lib/types";
import { spacing, type ThemeColors } from "../../lib/theme";
import { useLibrary } from "../../hooks/use-library";
import { useThemedStyles } from "../../lib/use-themed-styles";
import { usePreferences } from "../../providers/preferences-provider";
import { translateText } from "../../lib/translation";

export default function LibraryScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
  const { entries, collections, isLoading, error } = useLibrary();
  const [selectedShelf, setSelectedShelf] = useState<Shelf | "all">("all");
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<LibrarySort>(LibrarySort.Title);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const result = entries.filter((entry) => {
      if (selectedShelf !== "all" && entry.status !== selectedShelf) return false;
      if (
        selectedAuthors.length &&
        !selectedAuthors.some((author) => entry.book.authors.includes(author))
      ) return false;
      if (
        selectedCategories.length &&
        !selectedCategories.some((category) => entry.book.categories.includes(category))
      ) return false;
      if (
        selectedCollections.length &&
        !selectedCollections.some((collection) => entry.collectionIds.includes(collection))
      ) return false;
      if (!normalized) return true;
      return `${entry.book.title} ${entry.book.authors.join(" ")} ${entry.book.categories.join(" ")} ${entry.book.isbn ?? ""}`
        .toLocaleLowerCase()
        .includes(normalized);
    });
    result.sort((first, second) => {
      switch (sortBy) {
        case LibrarySort.Author:
          return (first.book.authors[0] ?? "").localeCompare(second.book.authors[0] ?? "");
        case LibrarySort.Rating:
          return first.rating === null
            ? second.rating === null ? 0 : 1
            : second.rating === null ? -1 : second.rating - first.rating;
        case LibrarySort.PageCount:
          return second.book.pageCount - first.book.pageCount;
        case LibrarySort.DateAdded:
          return second.createdAt.localeCompare(first.createdAt);
        default:
          return first.book.title.localeCompare(second.book.title);
      }
    });
    return result;
  }, [
    entries,
    query,
    selectedAuthors,
    selectedCategories,
    selectedCollections,
    selectedShelf,
    sortBy,
  ]);
  const authors = useMemo(
    () => [...new Set(entries.flatMap((entry) => entry.book.authors))].sort(),
    [entries],
  );
  const categories = useMemo(
    () => [...new Set(entries.flatMap((entry) => entry.book.categories))].sort(),
    [entries],
  );

  if (isLoading) return <LoadingState />;
  return (
    <Screen
      title="My library"
      subtitle={`${entries.length} ${translateText("books on your shelves", locale)}`}
    >
      {error ? <Notice message={error} /> : null}
      <AppButton
        label="Manage collections"
        onPress={() => router.push("/collections")}
        variant="secondary"
      />
      <TextField
        autoCapitalize="none"
        label="Search your library"
        onChangeText={setQuery}
        placeholder="Title, author, or ISBN"
        value={query}
      />
      <ShelfSelector
        includeAll
        onChange={(value) => {
          if (value === "all" || shelves.includes(value)) {
            setSelectedShelf(value);
          }
        }}
        value={selectedShelf}
      />
      <View style={styles.filters}>
        <OptionSelector
          label="Author"
          localizeOptions={false}
          onChange={setSelectedAuthors}
          options={authors.map((author) => ({ value: author, label: author }))}
          selected={selectedAuthors}
        />
        <OptionSelector
          label="Category"
          localizeOptions={false}
          onChange={setSelectedCategories}
          options={categories.map((category) => ({ value: category, label: category }))}
          selected={selectedCategories}
        />
        <OptionSelector
          label="Collection"
          localizeOptions={false}
          onChange={setSelectedCollections}
          options={collections.map(({ id, name }) => ({ value: id, label: name }))}
          selected={selectedCollections}
        />
        <OptionSelector
          label="Sort by"
          multiple={false}
          onChange={(values) => setSortBy((values[0] as LibrarySort) ?? LibrarySort.Title)}
          options={[
            { value: LibrarySort.Title, label: "Title" },
            { value: LibrarySort.Author, label: "Author" },
            { value: LibrarySort.Rating, label: "Rating" },
            { value: LibrarySort.PageCount, label: "Page count" },
            { value: LibrarySort.DateAdded, label: "Date added" },
          ]}
          selected={[sortBy]}
        />
      </View>
      <Text style={styles.count}>
        {filtered.length} {translateText(filtered.length === 1 ? "book" : "books", locale)}
      </Text>
      {filtered.length ? (
        filtered.map((entry) => (
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
            title={entries.length ? "No books match these filters" : "Your library is waiting"}
            description={
              entries.length
                ? "Try a different shelf or search term."
                : "Search the catalog and add a book to get started."
            }
          />
        </Panel>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  filters: { gap: spacing.sm },
  count: { color: colors.muted, fontSize: 13, fontWeight: "600", marginTop: spacing.xs },
});
