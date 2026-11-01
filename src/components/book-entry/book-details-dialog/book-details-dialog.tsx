"use client";

import { useState } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import DialogOverlay from "@/components/dialog-overlay/dialog-overlay";
import { X, Edit } from "lucide-react";
import Button from "@/components/button/button";
import IconButton from "@/components/icon-button/icon-button";
import TextInput from "@/components/text-input/text-input";
import BookCover from "@/components/book-cover/book-cover";
import { getNotificationRegion } from "@/lib/notifications";
import styles from "./book-details-dialog.module.css";
import type { BookDetailsDialogProps } from "./book-details-dialog.types";

export default function BookDetailsDialog({
  entry,
  labels,
  onSave,
  busy,
  asIconButton,
}: BookDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(
    entry.bookOverrides?.title || entry.book.title,
  );
  const [authorsText, setAuthorsText] = useState<string>(
    (entry.bookOverrides?.authors || entry.book.authors).join(", "),
  );
  const [isbn, setIsbn] = useState(entry.bookOverrides?.isbn || entry.book.isbn || "");
  const [pageCount, setPageCount] = useState(
    entry.bookOverrides?.pageCount !== undefined
      ? entry.bookOverrides.pageCount
      : entry.book.pageCount,
  );
  const [coverUrl, setCoverUrl] = useState(
    entry.bookOverrides?.coverUrl || entry.book.coverUrl || "",
  );

  function parseAuthors(text: string): string[] {
    return text
      .split(",")
      .map((author) => author.trim())
      .filter((author) => author.length > 0);
  }

  function handleSave() {
    const overrides: Record<string, unknown> = {};

    // Only include overrides that differ from original
    if (title !== entry.book.title) overrides.title = title;
    
    const parsedAuthors = parseAuthors(authorsText);
    if (JSON.stringify(parsedAuthors) !== JSON.stringify(entry.book.authors)) {
      overrides.authors = parsedAuthors;
    }
    
    if ((isbn || undefined) !== (entry.book.isbn || undefined)) {
      overrides.isbn = isbn || undefined;
    }
    if (pageCount !== entry.book.pageCount) overrides.pageCount = pageCount;
    if ((coverUrl || undefined) !== (entry.book.coverUrl || undefined)) {
      overrides.coverUrl = coverUrl || undefined;
    }

    onSave(overrides);
    setIsOpen(false);
  }

  function handleReset() {
    setTitle(entry.bookOverrides?.title || entry.book.title);
    setAuthorsText((entry.bookOverrides?.authors || entry.book.authors).join(", "));
    setIsbn(entry.bookOverrides?.isbn || entry.book.isbn || "");
    setPageCount(
      entry.bookOverrides?.pageCount !== undefined
        ? entry.bookOverrides.pageCount
        : entry.book.pageCount,
    );
    setCoverUrl(entry.bookOverrides?.coverUrl || entry.book.coverUrl || "");
  }

  return (
    <Dialog.Root
      persistentElements={[getNotificationRegion]}
      lazyMount
      unmountOnExit
      closeOnEscape={!busy}
      closeOnInteractOutside={!busy}
      open={isOpen}
      onOpenChange={({ open }) => {
        setIsOpen(open);
        if (!open) {
          handleReset();
        }
      }}
    >
      <Dialog.Trigger asChild>
        {asIconButton ? (
          <IconButton label={labels.editBookDetails} disabled={busy}>
            <Edit aria-hidden="true" />
          </IconButton>
        ) : (
          <Button variant="outline" disabled={busy}>
            {labels.editBookDetails}
          </Button>
        )}
      </Dialog.Trigger>
      <DialogOverlay>
        <Dialog.Content className={styles.dialog}>
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>
              {labels.editBookDetails}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <IconButton label={labels.close} disabled={busy}>
                <X aria-hidden="true" />
              </IconButton>
            </Dialog.CloseTrigger>
          </div>

          <div className={styles.content}>
            <div className={styles.preview}>
              <BookCover src={coverUrl || entry.book.coverUrl} />
            </div>

            <form className={styles.form} onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}>
              <TextInput
                label={labels.title}
                fieldClassName={`${styles.field} ${styles.formTitle}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={300}
                disabled={busy}
                required
              />

              <TextInput
                label={labels.authors}
                fieldClassName={`${styles.field} ${styles.formAuthors}`}
                value={authorsText}
                onChange={(e) => setAuthorsText(e.target.value)}
                maxLength={500}
                disabled={busy}
                placeholder="Author 1, Author 2, Author 3"
              />

              <TextInput
                label={labels.isbn}
                fieldClassName={`${styles.field} ${styles.formIsbn}`}
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                maxLength={20}
                disabled={busy}
              />

              <TextInput
                label={`${labels.pageCount} (${labels.pages})`}
                fieldClassName={`${styles.field} ${styles.formPageCount}`}
                type="number"
                value={String(pageCount)}
                onChange={(e) => setPageCount(Math.max(0, Number(e.target.value) || 0))}
                min="0"
                disabled={busy}
              />

              <TextInput
                label={labels.coverUrl}
                fieldClassName={`${styles.field} ${styles.formCoverUrl}`}
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                maxLength={2048}
                disabled={busy}
                type="url"
              />

              <div className={styles.actions}>
                <Dialog.CloseTrigger asChild>
                  <Button variant="secondary" disabled={busy}>
                    {labels.cancel}
                  </Button>
                </Dialog.CloseTrigger>
                <Button
                  type="submit"
                  loading={busy}
                  disabled={!title.trim()}
                >
                  {labels.save}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </DialogOverlay>
    </Dialog.Root>
  );
}
