import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "../../components/localized-text";
import { ChevronDown, ChevronRight, ScanBarcode, Search } from "lucide-react-native";
import { AppButton } from "../../components/app-button";
import { BarcodeScanner } from "../../components/barcode-scanner";
import { BookCard } from "../../components/book-card";
import { Notice } from "../../components/notice";
import { OptionSelector } from "../../components/option-selector";
import { Screen } from "../../components/screen";
import { TextField } from "../../components/text-field";
import { mobileApi } from "../../lib/api";
import { spacing, type ThemeColors } from "../../lib/theme";
import { shelves, type CatalogBook, type Shelf } from "../../lib/types";
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
  const { colors, locale } = usePreferences();
  const { collections } = useLibrary();
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<Shelf>("to-read");
  const [collectionId, setCollectionId] = useState("");
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
      await mobileApi.addBook(book, shelf, collectionId ? [collectionId] : []);
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
      headerIcon={<Search color={colors.secondaryContrast} size={24} />}
      titleKey="mobile.search.searchBooks"
    >
      <View style={styles.catalogPanel}>
        <View style={styles.sectionHeading}>
          <Search color={colors.primary} size={18} />
          <Text messageKey="mobile.search.addBooks" style={styles.sectionTitle} />
        </View>
        <View style={styles.searchForm}>
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
              icon={<Search color={colors.primaryContrast} size={16} />}
              label="mobile.search.search"
              loading={searching}
              onPress={() => void search()}
              style={styles.searchButton}
            />
            <AppButton
              icon={<ScanBarcode color={colors.secondaryContrast} size={16} />}
              label="mobile.search.scanIsbn"
              onPress={() => setShowScanner(true)}
              style={styles.searchButton}
              variant="secondary"
            />
          </View>
        </View>
        <View style={styles.selectRow}>
          <View style={styles.selectField}>
            <OptionSelector
              labelKey="mobile.search.addToShelf"
              multiple={false}
              onChange={(values) => {
                const nextShelf = shelves.find((option) => option === values[0]);
                if (nextShelf) setShelf(nextShelf);
              }}
              options={shelves.map((value) => ({
                value,
                messageKey: getShelfMessageKey(value),
              }))}
              selected={[shelf]}
            />
          </View>
          <View style={styles.selectField}>
            <OptionSelector
              emptyLabelKey="mobile.search.noCollection"
              labelKey="mobile.search.addToCollection"
              multiple={false}
              onChange={(values) => setCollectionId(values[0] ?? "")}
              options={collections.map(({ id, name }) => ({
                value: id,
                label: name,
              }))}
              selected={collectionId ? [collectionId] : []}
            />
          </View>
        </View>
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
        <View style={styles.manualDetails}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showManual }}
            onPress={() => setShowManual((current) => !current)}
            style={styles.manualToggle}
          >
            {showManual ? (
              <ChevronDown color={colors.primary} size={16} />
            ) : (
              <ChevronRight color={colors.primary} size={16} />
            )}
            <Text
              messageKey="mobile.search.manualSummary"
              style={styles.manualSummary}
            />
          </Pressable>
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
          ) : null}
        </View>
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
        variant="outline"
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  catalogPanel: {
    gap: 20,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "600" },
  searchForm: { gap: spacing.md },
  searchActions: { flexDirection: "row", gap: spacing.md },
  searchButton: { flex: 1, minWidth: 0 },
  selectRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  selectField: { flex: 1, minWidth: 0 },
  results: { gap: spacing.md },
  manualDetails: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  manualToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  manualSummary: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  manualForm: { gap: spacing.md },
});
