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
import { useThemedStyles } from "../../lib/use-themed-styles";

export default function SearchScreen() {
  const styles = useThemedStyles(createStyles);
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
        setMessage("No results found. You can add the book manually below.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not search the catalog.");
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
      setMessage(`Added “${book.title}” to ${shelf.replaceAll("-", " ")}.`);
      setResults((current) => current.filter((result) => result.externalId !== book.externalId));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add this book.");
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
      setError("Enter a title for the book.");
      return;
    }
    if (!Number.isInteger(pageCount) || pageCount < 0) {
      setError("Page count must be a whole number greater than or equal to zero.");
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
      title="Find your next read"
      subtitle="Search the catalog or add a book that isn't listed."
    >
      <Panel style={styles.searchPanel}>
        <TextField
          autoCapitalize="none"
          label="Title, author, or ISBN"
          onChangeText={setQuery}
          onSubmitEditing={() => void search()}
          placeholder="Try a title or ISBN"
          value={query}
        />
        <View style={styles.searchActions}>
          <AppButton
            disabled={query.trim().length < 2}
            label="Search books"
            loading={searching}
            onPress={() => void search()}
            style={styles.searchButton}
          />
          <AppButton
            label="Scan ISBN"
            onPress={() => setShowScanner(true)}
            variant="secondary"
            style={styles.searchButton}
          />
        </View>
      </Panel>
      <View style={styles.shelfSection}>
        <Text style={styles.sectionTitle}>Add to shelf</Text>
        <ShelfSelector
          onChange={(value) => {
            if (value !== "all") setShelf(value);
          }}
          value={shelf}
        />
        <OptionSelector
          label="Add to collection"
          localizeOptions={false}
          onChange={setCollectionIds}
          options={collections.map(({ id, name }) => ({ value: id, label: name }))}
          selected={collectionIds}
        />
        <AppButton
          label="Manage collections"
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
          <Text style={styles.sectionTitle}>Search results</Text>
          {results.map((book, index) => {
            const key = book.externalId ?? `${book.title}-${index}`;
            return (
              <BookCard
                actionLabel={addingId === key ? "Adding…" : "Add to library"}
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
            title="A good book is out there"
            description="Search by title, author, or ISBN to see catalog results."
          />
        </Panel>
      ) : null}
      <Panel style={styles.manualPanel}>
        <Text style={styles.sectionTitle}>Can’t find it?</Text>
        <Text style={styles.description}>Add the book details yourself.</Text>
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
            label="Add a book manually"
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
      <TextField label="Title" onChangeText={setTitle} value={title} />
      <TextField
        label="Author(s)"
        onChangeText={setAuthors}
        placeholder="Separate multiple authors with commas"
        value={authors}
      />
      <TextField
        keyboardType="number-pad"
        label="Page count"
        onChangeText={setPageCount}
        value={pageCount}
      />
      <TextField
        label="Categories"
        onChangeText={setCategories}
        placeholder="Separate categories with commas"
        value={categories}
      />
      <TextField
        autoCapitalize="none"
        label="Cover image URL (optional)"
        onChangeText={setCoverUrl}
        keyboardType="url"
        value={coverUrl}
      />
      <AppButton
        label="Save book"
        loading={busy}
        onPress={() => onSave({ title, authors, pageCount, categories, coverUrl })}
      />
      <AppButton label="Cancel" onPress={onCancel} variant="secondary" />
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
