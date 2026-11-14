import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { LocalizedText } from "../../components/localized-text";
import { AppButton } from "../../components/app-button";
import { BookCover } from "../../components/book-cover";
import { LoadingState } from "../../components/loading-state";
import { Notice } from "../../components/notice";
import { OptionSelector } from "../../components/option-selector";
import { Panel } from "../../components/panel";
import { ProgressBar } from "../../components/progress-bar";
import { RatingControl } from "../../components/rating-control";
import { Screen } from "../../components/screen";
import { ShelfSelector } from "../../components/shelf-selector";
import { TextField } from "../../components/text-field";
import { useLibrary } from "../../hooks/use-library";
import { mobileApi } from "../../lib/api";
import { spacing, type ThemeColors } from "../../lib/theme";
import type { Shelf } from "../../lib/types";
import { useThemedStyles } from "../../lib/use-themed-styles";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookDetailsScreen() {
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, collections, isLoading, error: libraryError, refresh } = useLibrary();
  const entry = entries.find((item) => item.id === id);
  const [draft, setDraft] = useState<{
    id: string;
    status: Shelf;
    currentPage: string;
    rating: number | null;
    review: string;
    startedAt: string;
    finishedAt: string;
    collectionIds: string[];
  } | null>(null);
  const [metadata, setMetadata] = useState<{
    id: string;
    title: string;
    authors: string;
    isbn: string;
    pageCount: string;
    coverUrl: string;
  } | null>(null);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const values =
    entry && draft?.id === entry.id
      ? draft
      : entry
        ? {
            id: entry.id,
            status: entry.status,
            currentPage: String(entry.currentPage ?? 0),
            rating: entry.rating,
            review: entry.review,
            startedAt: entry.startedAt,
            finishedAt: entry.finishedAt,
            collectionIds: entry.collectionIds,
          }
        : null;

  function updateDraft(changes: Partial<NonNullable<typeof values>>) {
    if (!entry || !values) return;
    setDraft({ ...values, ...changes, id: entry.id });
  }

  function changeStatus(value: Shelf) {
    if (!values) return;
    updateDraft({
      status: value,
      ...(value === "currently-reading" && !values.startedAt
        ? { startedAt: today() }
        : {}),
      ...(value === "read" && !values.finishedAt
        ? { finishedAt: today() }
        : {}),
    });
  }

  async function save() {
    if (!entry || !values) return;
    const currentPage = values.currentPage.trim()
      ? Number(values.currentPage)
      : 0;
    if (
      !Number.isInteger(currentPage) ||
      currentPage < 0 ||
      (entry.book.pageCount > 0 && currentPage > entry.book.pageCount)
    ) {
      setError(
        entry.book.pageCount > 0
          ? `Current page must be from 0 to ${entry.book.pageCount}.`
          : "Current page must be a non-negative whole number.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await mobileApi.updateBook(entry.id, {
        status: values.status,
        currentPage,
        rating: values.rating,
        review: values.review,
        startedAt: values.startedAt,
        finishedAt: values.finishedAt,
        collectionIds: values.collectionIds,
      });
      refresh();
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your changes.");
    } finally {
      setBusy(false);
    }
  }

  function confirmRemove() {
    if (!entry) return;
    Alert.alert(
      "Remove book?",
      `Remove “${entry.book.title}” from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setBusy(true);
            mobileApi
              .removeBook(entry.id)
              .then(() => {
                refresh();
                router.back();
              })
              .catch((cause: unknown) =>
                setError(
                  cause instanceof Error ? cause.message : "Could not remove this book.",
                ),
              )
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  }

  if (isLoading) return <LoadingState />;
  if (!entry) {
    return (
      <Screen title="Book details">
        <Notice message={libraryError || "This book is not in your library."} />
        <AppButton label="Back to library" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!values) return <LoadingState />;
  const metadataValues =
    metadata?.id === entry.id
      ? metadata
      : {
          id: entry.id,
          title: entry.book.title,
          authors: entry.book.authors.join(", "),
          isbn: entry.book.isbn ?? "",
          pageCount: String(entry.book.pageCount || ""),
          coverUrl: entry.book.coverUrl ?? "",
        };
  function startMetadataEdit() {
    setMetadata(metadataValues);
    setEditingMetadata(true);
  }
  async function saveMetadata() {
    if (!entry) return;
    const pageCount = metadataValues.pageCount.trim()
      ? Number(metadataValues.pageCount)
      : 0;
    if (!metadataValues.title.trim()) {
      setError("Enter a title for the book.");
      return;
    }
    if (!Number.isInteger(pageCount) || pageCount < 0) {
      setError("Page count must be a non-negative whole number.");
      return;
    }
    if (pageCount > 0 && entry.currentPage > pageCount) {
      setError("Page count cannot be less than the current reading page.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await mobileApi.updateBook(entry.id, {
        bookOverrides: {
          title: metadataValues.title.trim(),
          authors: metadataValues.authors
            .split(",")
            .map((author) => author.trim())
            .filter(Boolean),
          isbn: metadataValues.isbn.trim(),
          pageCount,
          coverUrl: metadataValues.coverUrl.trim(),
        },
      });
      setEditingMetadata(false);
      setMetadata(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update book information.");
    } finally {
      setBusy(false);
    }
  }
  const status = values.status;
  const showDates = status === "currently-reading" || status === "read";
  return (
    <Screen title={entry.book.title} subtitle={entry.book.authors.join(", ") || "Unknown author"}>
      <Panel style={styles.bookPanel}>
        <BookCover url={entry.book.coverUrl} title={entry.book.title} />
        <View style={styles.bookFacts}>
          {entry.book.pageCount > 0 ? (
            <Text style={styles.fact}>{entry.book.pageCount} pages</Text>
          ) : null}
          {entry.book.categories.length ? (
            <Text style={styles.fact}>{entry.book.categories.join(", ")}</Text>
          ) : null}
          {entry.book.isbn ? <Text style={styles.fact}>ISBN {entry.book.isbn}</Text> : null}
        </View>
      </Panel>
      <Panel style={styles.form}>
        <LocalizedText style={styles.sectionTitle}>Book information</LocalizedText>
        {editingMetadata ? (
          <>
            <TextField
              label="Title"
              maxLength={300}
              onChangeText={(title) => setMetadata({ ...metadataValues, title })}
              value={metadataValues.title}
            />
            <TextField
              label="Author(s)"
              onChangeText={(authors) => setMetadata({ ...metadataValues, authors })}
              placeholder="Separate multiple authors with commas"
              value={metadataValues.authors}
            />
            <TextField
              label="ISBN"
              onChangeText={(isbn) => setMetadata({ ...metadataValues, isbn })}
              value={metadataValues.isbn}
            />
            <TextField
              keyboardType="number-pad"
              label="Page count"
              onChangeText={(pageCount) => setMetadata({ ...metadataValues, pageCount })}
              value={metadataValues.pageCount}
            />
            <TextField
              autoCapitalize="none"
              keyboardType="url"
              label="Cover image URL"
              onChangeText={(coverUrl) => setMetadata({ ...metadataValues, coverUrl })}
              value={metadataValues.coverUrl}
            />
            <AppButton label="Save book information" loading={busy} onPress={() => void saveMetadata()} />
            <AppButton
              disabled={busy}
              label="Cancel"
              onPress={() => {
                setEditingMetadata(false);
                setMetadata(null);
                setError("");
              }}
              variant="secondary"
            />
          </>
        ) : (
          <AppButton
            label="Edit book information"
            onPress={startMetadataEdit}
            variant="secondary"
          />
        )}
      </Panel>
      <Panel style={styles.form}>
        <LocalizedText style={styles.sectionTitle}>Shelf</LocalizedText>
        <ShelfSelector onChange={(value) => value !== "all" && changeStatus(value)} value={status} />
        <OptionSelector
          label="Collections"
          localizeOptions={false}
          onChange={(collectionIds) => updateDraft({ collectionIds })}
          options={collections.map(({ id: collectionId, name }) => ({
            value: collectionId,
            label: name,
          }))}
          selected={values.collectionIds}
        />
        {status === "currently-reading" ? (
          <>
            <ProgressBar
              currentPage={Number(values.currentPage) || 0}
              pageCount={entry.book.pageCount}
            />
            <TextField
              keyboardType="number-pad"
              label={`Current page${entry.book.pageCount > 0 ? ` (of ${entry.book.pageCount})` : ""}`}
              onChangeText={(currentPage) => updateDraft({ currentPage })}
              value={values.currentPage}
            />
            {entry.book.pageCount > 0 &&
            Number(values.currentPage) >= entry.book.pageCount ? (
              <>
                <Notice
                  message="You’ve reached the last page."
                  variant="success"
                />
                <AppButton
                  label="Mark as read"
                  onPress={() => changeStatus("read")}
                  variant="secondary"
                />
              </>
            ) : null}
          </>
        ) : null}
        {showDates ? (
          <>
            <TextField
              autoCapitalize="none"
              label="Started (YYYY-MM-DD)"
              onChangeText={(startedAt) => updateDraft({ startedAt })}
              placeholder="2026-01-31"
              value={values.startedAt}
            />
            {status === "read" ? (
              <TextField
                autoCapitalize="none"
                label="Finished (YYYY-MM-DD)"
                onChangeText={(finishedAt) => updateDraft({ finishedAt })}
                placeholder="2026-01-31"
                value={values.finishedAt}
              />
            ) : null}
          </>
        ) : null}
        {status === "read" || status === "did-not-finish" ? (
          <>
            <RatingControl
              onChange={(rating) => updateDraft({ rating })}
              value={values.rating}
            />
            <TextField
              label="Review or notes"
              maxLength={5000}
              multiline
              onChangeText={(review) => updateDraft({ review })}
              placeholder="What did you think?"
              value={values.review}
            />
          </>
        ) : null}
        {error ? <Notice message={error} /> : null}
        <AppButton label="Save changes" loading={busy} onPress={() => void save()} />
        <AppButton
          label="Remove from library"
          onPress={confirmRemove}
          variant="danger"
          disabled={busy}
        />
      </Panel>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  bookPanel: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  bookFacts: { flex: 1, gap: spacing.sm },
  fact: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  form: { gap: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
