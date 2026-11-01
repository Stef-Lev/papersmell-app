"use client";

import React, { useCallback, useMemo } from "react";
import styles from "./book-entry.module.css";
import { Dialog } from "@ark-ui/react/dialog";
import DialogOverlay from "@/components/dialog-overlay/dialog-overlay";
import BookDetailsDialog from "@/components/book-entry/book-details-dialog/book-details-dialog";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import Dropdown from "@/components/dropdown/dropdown";
import Button from "@/components/button/button";
import BookCover from "@/components/book-cover/book-cover";
import DateInput from "@/components/date-input/date-input";
import Textarea from "@/components/textarea/textarea";
import StarRating from "@/components/star-rating/star-rating";
import { toCollectionOptions } from "@/lib/collections";
import { toDateOnly } from "@/lib/dates";
import { getNotificationRegion } from "@/lib/notifications";
import { SHELVES, Shelf, isShelf } from "@/lib/shelves";
import type { BookEntryProps } from "./book-entry.types";

export default React.memo(function BookEntry({
  entry,
  collections,
  shelfNames,
  labels,
  onChange,
  onSave,
  onRemove,
  busy,
}: BookEntryProps) {
  const selectedCollection = collections.find((collection) =>
    entry.collectionIds.includes(collection.id),
  );

  const showStarted =
    entry.status === Shelf.CurrentlyReading || entry.status === Shelf.Read;
  const showFinished = entry.status === Shelf.Read;
  const showFeedback =
    entry.status === Shelf.Read || entry.status === Shelf.DidNotFinish;

  const update = useCallback((changes: Partial<BookEntryProps["entry"]>) => {
    onChange(entry.id, changes);
  }, [onChange, entry.id]);

  const changeStatus = useCallback((status: Shelf) => {
    const today = toDateOnly();
    update({
      status,
      ...(status === Shelf.CurrentlyReading &&
        !entry.startedAt && { startedAt: today }),
      ...(status === Shelf.Read && !entry.finishedAt && { finishedAt: today }),
    });
  }, [update, entry.startedAt, entry.finishedAt]);

  const shelfOptions = useMemo(
    () => SHELVES.map((shelf) => ({
      value: shelf,
      label: shelfNames[shelf],
    })),
    [shelfNames],
  );

  const collectionOptions = useMemo(
    () => toCollectionOptions(collections, labels.noCollection),
    [collections, labels.noCollection],
  );

  const handleCollectionChange = useCallback(
    (value: string) => {
      update({ collectionIds: value ? [value] : [] });
    },
    [update],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      if (isShelf(value)) changeStatus(value);
    },
    [changeStatus],
  );

  const handleStartedAtChange = useCallback(
    (value: string) => {
      update({ startedAt: value });
    },
    [update],
  );

  const handleFinishedAtChange = useCallback(
    (value: string) => {
      update({ finishedAt: value });
    },
    [update],
  );

  const handleRatingChange = useCallback(
    (rating: number | null) => {
      update({ rating: rating ?? 0 });
    },
    [update],
  );

  const handleReviewChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      update({ review: event.target.value });
    },
    [update],
  );

  const handleSave = useCallback(
    () => {
      onSave(entry);
    },
    [onSave, entry],
  );

  const handleRemove = useCallback(
    () => {
      onRemove(entry);
    },
    [onRemove, entry],
  );

  return (
    <article className={styles.entry}>
      <div className={styles.header}>
        <BookCover className={styles.cover} src={entry.book.coverUrl} />
        <div className={styles.details}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{entry.book.title}</h3>
            <BookDetailsDialog
              entry={entry}
              labels={{
                editBookDetails: labels.editBookDetails,
                title: labels.title,
                authors: labels.authors,
                isbn: labels.isbn,
                pageCount: labels.pageCount,
                coverUrl: labels.coverUrl,
                addAuthor: labels.addAuthor,
                pages: labels.pages,
                save: labels.save,
                cancel: labels.cancel,
                close: labels.close,
              }}
              onSave={(overrides) => update({ bookOverrides: overrides })}
              busy={busy}
              asIconButton
            />
          </div>
          <p className={styles.muted}>
            {entry.book.authors.length
              ? entry.book.authors.join(", ")
              : labels.noAuthor}
          </p>
          <p className={styles.muted}>
            {entry.book.pageCount
              ? `${entry.book.pageCount} ${labels.pages}`
              : ""}
            {entry.book.categories.length
              ? ` · ${entry.book.categories.join(", ")}`
              : ""}
          </p>
        </div>
      </div>
      <div className={styles.fields}>
        <Dropdown
          label={labels.status}
          fieldClassName={styles.field}
          value={entry.status}
          disabled={busy}
          onValueChange={handleStatusChange}
          options={shelfOptions}
        />
        <Dropdown
          label={labels.collection}
          fieldClassName={styles.field}
          className={styles.collectionSelect}
          value={selectedCollection?.id ?? ""}
          disabled={busy}
          onValueChange={handleCollectionChange}
          options={collectionOptions}
        />
        {(showStarted || showFinished) && (
          <div className={styles.dates}>
            {showStarted && (
              <DateInput
                label={labels.startedAt}
                fieldClassName={styles.field}
                value={entry.startedAt}
                onValueChange={handleStartedAtChange}
              />
            )}
            {showFinished && (
              <DateInput
                label={labels.finishedAt}
                fieldClassName={styles.field}
                value={entry.finishedAt}
                onValueChange={handleFinishedAtChange}
              />
            )}
          </div>
        )}
        {showFeedback && (
          <>
            <div className={styles.rating}>
              <StarRating
                label={labels.rating}
                value={entry.rating}
                onValueChange={handleRatingChange}
                disabled={busy}
              />
            </div>
            <div className={styles.review}>
              <Textarea
                label={labels.review}
                fieldClassName={styles.field}
                className={styles.textarea}
                value={entry.review}
                maxLength={5000}
                onChange={handleReviewChange}
              />
            </div>
          </>
        )}
      </div>
      <div className={styles.actions}>
        <Button loading={busy} onClick={handleSave}>
          <Save aria-hidden="true" />
          {labels.save}
        </Button>
        <Dialog.Root
          persistentElements={[getNotificationRegion]}
          role="alertdialog"
          lazyMount
          unmountOnExit
          closeOnInteractOutside={false}
        >
          <Dialog.Trigger asChild>
            <Button variant="destructive" disabled={busy}>
              <Trash2 aria-hidden="true" />
              {labels.remove}
            </Button>
          </Dialog.Trigger>
          <DialogOverlay>
            <Dialog.Content className={styles.removeDialog}>
              <Dialog.Title className={styles.removeTitle}>
                <AlertTriangle aria-hidden="true" />
                {labels.removeTitle}
              </Dialog.Title>
              <Dialog.Description className={styles.removeDescription}>
                {labels.confirmRemove(entry.book.title)}
              </Dialog.Description>
              <div className={styles.dialogActions}>
                <Dialog.CloseTrigger asChild>
                  <Button variant="secondary">{labels.cancel}</Button>
                </Dialog.CloseTrigger>
                <Dialog.CloseTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={handleRemove}
                  >
                    <Trash2 aria-hidden="true" />
                    {labels.remove}
                  </Button>
                </Dialog.CloseTrigger>
              </div>
            </Dialog.Content>
          </DialogOverlay>
        </Dialog.Root>
      </div>
    </article>
  );
});
