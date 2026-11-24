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
import { getErrorMessage, translateMessage } from "../../lib/translation";
import { useThemedStyles } from "../../lib/use-themed-styles";
import { usePreferences } from "../../providers/preferences-provider";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookDetailsScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
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
          ? translateMessage("mobile.errors.currentPageRange", locale, {
              pageCount: entry.book.pageCount,
            })
          : translateMessage("mobile.errors.currentPageNonNegative", locale),
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
      setError(getErrorMessage(cause, locale, "mobile.errors.saveChanges"));
    } finally {
      setBusy(false);
    }
  }

  function confirmRemove() {
    if (!entry) return;
    Alert.alert(
      translateMessage("mobile.book.removeTitle", locale),
      translateMessage("mobile.book.removeDescription", locale, {
        title: entry.book.title,
      }),
      [
        { text: translateMessage("mobile.common.cancel", locale), style: "cancel" },
        {
          text: translateMessage("mobile.book.removeFromLibrary", locale),
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
                  getErrorMessage(cause, locale, "mobile.errors.removeBook"),
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
      <Screen titleKey="mobile.book.details">
        <Notice
          message={
            libraryError ||
            translateMessage("mobile.book.notInLibrary", locale)
          }
        />
        <AppButton label="mobile.book.backToLibrary" onPress={() => router.back()} />
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
      setError(translateMessage("mobile.errors.bookTitleRequired", locale));
      return;
    }
    if (!Number.isInteger(pageCount) || pageCount < 0) {
      setError(translateMessage("mobile.errors.pageCountNonNegative", locale));
      return;
    }
    if (pageCount > 0 && entry.currentPage > pageCount) {
      setError(translateMessage("mobile.errors.pageCountBelowCurrent", locale));
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
      setError(
        getErrorMessage(
          cause,
          locale,
          "mobile.errors.updateBookInformation",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  const status = values.status;
  const showDates = status === "currently-reading" || status === "read";
  return (
    <Screen
      title={entry.book.title}
      subtitle={
        entry.book.authors.join(", ") ||
        translateMessage("mobile.common.unknownAuthor", locale)
      }
    >
      <Panel style={styles.bookPanel}>
        <BookCover url={entry.book.coverUrl} title={entry.book.title} />
        <View style={styles.bookFacts}>
          {entry.book.pageCount > 0 ? (
            <Text style={styles.fact}>
              {entry.book.pageCount}{" "}
              {translateMessage("mobile.common.pages", locale)}
            </Text>
          ) : null}
          {entry.book.categories.length ? (
            <Text style={styles.fact}>{entry.book.categories.join(", ")}</Text>
          ) : null}
          {entry.book.isbn ? (
            <Text style={styles.fact}>
              {translateMessage("mobile.book.isbnFact", locale, {
                isbn: entry.book.isbn,
              })}
            </Text>
          ) : null}
        </View>
      </Panel>
      <Panel style={styles.form}>
        <LocalizedText
          messageKey="mobile.book.information"
          style={styles.sectionTitle}
        />
        {editingMetadata ? (
          <>
            <TextField
              label="mobile.book.title"
              maxLength={300}
              onChangeText={(title) => setMetadata({ ...metadataValues, title })}
              value={metadataValues.title}
            />
            <TextField
              label="mobile.book.authors"
              onChangeText={(authors) => setMetadata({ ...metadataValues, authors })}
              placeholder="mobile.search.separateAuthors"
              value={metadataValues.authors}
            />
            <TextField
              label="mobile.book.isbn"
              onChangeText={(isbn) => setMetadata({ ...metadataValues, isbn })}
              value={metadataValues.isbn}
            />
            <TextField
              keyboardType="number-pad"
              label="mobile.book.pageCount"
              onChangeText={(pageCount) => setMetadata({ ...metadataValues, pageCount })}
              value={metadataValues.pageCount}
            />
            <TextField
              autoCapitalize="none"
              keyboardType="url"
              label="mobile.book.coverUrl"
              onChangeText={(coverUrl) => setMetadata({ ...metadataValues, coverUrl })}
              value={metadataValues.coverUrl}
            />
            <AppButton
              label="mobile.book.saveInformation"
              loading={busy}
              onPress={() => void saveMetadata()}
            />
            <AppButton
              disabled={busy}
              label="mobile.common.cancel"
              onPress={() => {
                setEditingMetadata(false);
                setMetadata(null);
                setError("");
              }}
              variant="outline"
            />
          </>
        ) : (
          <AppButton
            label="mobile.book.editInformation"
            onPress={startMetadataEdit}
            variant="outline"
          />
        )}
      </Panel>
      <Panel style={styles.form}>
        <LocalizedText messageKey="mobile.book.shelf" style={styles.sectionTitle} />
        <ShelfSelector onChange={(value) => value !== "all" && changeStatus(value)} value={status} />
        <OptionSelector
          labelKey="mobile.book.collections"
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
              label={
                entry.book.pageCount > 0
                  ? "mobile.book.currentPageOf"
                  : "mobile.book.currentPage"
              }
              labelValues={
                entry.book.pageCount > 0
                  ? { pageCount: entry.book.pageCount }
                  : undefined
              }
              onChangeText={(currentPage) => updateDraft({ currentPage })}
              value={values.currentPage}
            />
            {entry.book.pageCount > 0 &&
            Number(values.currentPage) >= entry.book.pageCount ? (
              <>
                <Notice
                  messageKey="mobile.book.lastPageReached"
                  variant="success"
                />
                <AppButton
                  label="mobile.book.markRead"
                  onPress={() => changeStatus("read")}
                  variant="outline"
                />
              </>
            ) : null}
          </>
        ) : null}
        {showDates ? (
          <>
            <TextField
              autoCapitalize="none"
              label="mobile.book.startedDate"
              onChangeText={(startedAt) => updateDraft({ startedAt })}
              placeholder="mobile.book.datePlaceholder"
              value={values.startedAt}
            />
            {status === "read" ? (
              <TextField
                autoCapitalize="none"
                label="mobile.book.finishedDate"
                onChangeText={(finishedAt) => updateDraft({ finishedAt })}
                placeholder="mobile.book.datePlaceholder"
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
              label="mobile.book.reviewNotes"
              maxLength={5000}
              multiline
              onChangeText={(review) => updateDraft({ review })}
              placeholder="mobile.book.reviewPlaceholder"
              value={values.review}
            />
          </>
        ) : null}
        {error ? <Notice message={error} /> : null}
        <AppButton
          label="mobile.book.saveChanges"
          loading={busy}
          onPress={() => void save()}
        />
        <AppButton
          label="mobile.book.removeFromLibrary"
          onPress={confirmRemove}
          variant="destructive"
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
