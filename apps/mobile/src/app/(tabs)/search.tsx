import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "../../components/localized-text";
import { router } from "expo-router";
import { AppButton } from "../../components/app-button";
import { BarcodeScanner } from "../../components/barcode-scanner";
import { BookCard } from "../../components/book-card";
import { EmptyState } from "../../components/empty-state";
import { Notice } from "../../components/notice";
import { OptionSelector } from "../../components/option-selector";
import { Panel } from "../../components/panel";
import { Screen } from "../../components/screen";
import { ShelfSelector } from "../../components/shelf-selector";
import { TextField } from "../../components/text-field";
import { mobileApi } from "../../lib/api";
import { spacing, type ThemeColors } from "../../lib/theme";
import type { CatalogBook, Shelf } from "../../lib/types";
import { useLibrary } from "../../hooks/use-library";
import {
  getErrorMessage,
  getShelfMessageKey,
  translateMessage,
} from "../../lib/translation";
import { useThemedStyles } from "../../lib/use-themed-styles";
import { usePreferences } from "../../providers/preferences-provider";

export default function SearchScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
  const { collections } = useLibrary();
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<Shelf>("to-read");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [results, setResults] = useState<CatalogBook[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  async function search(searchQuery = query) {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) return;
    setSearching(true);
    setError("");
    setMessage("");
    setResults([]);
    try {
      const response = await mobileApi.searchBooks(trimmedQuery);
      setResults(response.results);
      if (!response.results.length) {
        setMessage(translateMessage("mobile.search.noResults", locale));
      }
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.searchCatalog"));
    } finally {
      setSearching(false);
    }
  }

  async function addBook(book: CatalogBook, key: string) {
    if (addingId) return false;
    setAddingId(key);
    setError("");
    setMessage("");
    try {
      await mobileApi.addBook(book, shelf, collectionIds);
      setMessage(
        translateMessage("mobile.search.addedBook", locale, {
          title: book.title,
          shelf: translateMessage(getShelfMessageKey(shelf), locale),
        }),
      );
      setResults((current) => current.filter((result) => result.externalId !== book.externalId));
      return true;
    } catch (cause) {
      setError(getErrorMessage(cause, locale, "mobile.errors.addBook"));
      return false;
    } finally {
      setAddingId("");
    }
  }

  async function addManualBook(values: {
    title: string;
    authors: string;
    pageCount: string;
    categories: string;
    coverUrl: string;
  }) {
    const pageCount = values.pageCount.trim() ? Number(values.pageCount) : 0;
    if (!values.title.trim()) {
      setError(translateMessage("mobile.errors.bookTitleRequired", locale));
      return;
    }
    if (!Number.isInteger(pageCount) || pageCount < 0) {
      setError(translateMessage("mobile.errors.pageCountWholeNumber", locale));
      return;
    }
    const book: CatalogBook = {
      source: "manual",
      title: values.title.trim(),
      authors: values.authors.split(",").map((author) => author.trim()).filter(Boolean),
      pageCount,
      categories: values.categories.split(",").map((category) => category.trim()).filter(Boolean),
      ...(values.coverUrl.trim() ? { coverUrl: values.coverUrl.trim() } : {}),
    };
    if (await addBook(book, "manual")) setShowManual(false);
  }

  return (
    <Screen
      bottomNavigation
      titleKey="mobile.search.title"
      subtitleKey="mobile.search.subtitle"
    >
      <Panel style={styles.searchPanel}>
        <TextField
          autoCapitalize="none"
          label="mobile.search.titleAuthorIsbn"
          onChangeText={setQuery}
          onSubmitEditing={() => void search()}
          placeholder="mobile.search.tryTitleIsbn"
          value={query}
        />
        <View style={styles.searchActions}>
          <AppButton
            disabled={query.trim().length < 2}
            label="mobile.search.searchBooks"
            loading={searching}
            onPress={() => void search()}
            style={styles.searchButton}
          />
          <AppButton
            label="mobile.search.scanIsbn"
            onPress={() => setShowScanner(true)}
            variant="secondary"
            style={styles.searchButton}
          />
        </View>
      </Panel>
      <View style={styles.shelfSection}>
        <Text messageKey="mobile.search.addToShelf" style={styles.sectionTitle} />
        <ShelfSelector
          onChange={(value) => {
            if (value !== "all") setShelf(value);
          }}
          value={shelf}
        />
        <OptionSelector
          labelKey="mobile.search.addToCollection"
          onChange={setCollectionIds}
          options={collections.map(({ id, name }) => ({ value: id, label: name }))}
          selected={collectionIds}
        />
        <AppButton
          label="mobile.library.manageCollections"
          onPress={() => router.push("/collections")}
          variant="secondary"
        />
      </View>
      {showScanner ? (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScanned={(isbn) => {
            setShowScanner(false);
            setQuery(isbn);
            void search(isbn);
          }}
        />
      ) : null}
      {error ? <Notice message={error} /> : null}
      {message ? <Notice message={message} variant="success" /> : null}
      {results.length ? (
        <View style={styles.results}>
          <Text messageKey="mobile.search.searchResults" style={styles.sectionTitle} />
          {results.map((book, index) => {
            const key = book.externalId ?? `${book.title}-${index}`;
            return (
              <BookCard
                actionLabel={
                  addingId === key
                    ? "mobile.search.adding"
                    : "mobile.search.addToLibrary"
                }
                book={book}
                key={key}
                onPress={() => void addBook(book, key)}
              />
            );
          })}
        </View>
      ) : null}
      {!results.length && !message && !searching ? (
        <Panel>
          <EmptyState
            titleKey="mobile.search.emptyTitle"
            descriptionKey="mobile.search.emptyDescription"
          />
        </Panel>
      ) : null}
      <Panel style={styles.manualPanel}>
        <Text messageKey="mobile.search.cannotFind" style={styles.sectionTitle} />
        <Text messageKey="mobile.search.manualDescription" style={styles.description} />
        {showManual ? (
          <ManualBookForm
            busy={addingId === "manual"}
            onCancel={() => {
              setShowManual(false);
              setError("");
            }}
            onSave={(values) => {
              setError("");
              void addManualBook(values);
            }}
          />
        ) : (
          <AppButton
            label="mobile.search.manualAdd"
            onPress={() => setShowManual(true)}
            variant="secondary"
          />
        )}
      </Panel>
    </Screen>
  );
}

function ManualBookForm({
  busy,
  onCancel,
  onSave,
}: {
  busy: boolean;
  onCancel: () => void;
  onSave: (values: {
    title: string;
    authors: string;
    pageCount: string;
    categories: string;
    coverUrl: string;
  }) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [categories, setCategories] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  return (
    <View style={styles.manualForm}>
      <TextField
        label="mobile.search.titleField"
        onChangeText={setTitle}
        value={title}
      />
      <TextField
        label="mobile.search.authors"
        onChangeText={setAuthors}
        placeholder="mobile.search.separateAuthors"
        value={authors}
      />
      <TextField
        keyboardType="number-pad"
        label="mobile.search.pageCount"
        onChangeText={setPageCount}
        value={pageCount}
      />
      <TextField
        label="mobile.search.categories"
        onChangeText={setCategories}
        placeholder="mobile.search.separateCategories"
        value={categories}
      />
      <TextField
        autoCapitalize="none"
        label="mobile.search.coverUrlOptional"
        onChangeText={setCoverUrl}
        keyboardType="url"
        value={coverUrl}
      />
      <AppButton
        label="mobile.search.saveBook"
        loading={busy}
        onPress={() => onSave({ title, authors, pageCount, categories, coverUrl })}
      />
      <AppButton
        label="mobile.common.cancel"
        onPress={onCancel}
        variant="secondary"
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  searchPanel: { gap: spacing.lg },
  searchActions: { flexDirection: "row", gap: spacing.sm },
  searchButton: { flex: 1 },
  shelfSection: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  results: { gap: spacing.md },
  manualPanel: { gap: spacing.md, marginTop: spacing.sm },
  manualForm: { gap: spacing.md },
  description: { color: colors.muted, fontSize: 14 },
});
