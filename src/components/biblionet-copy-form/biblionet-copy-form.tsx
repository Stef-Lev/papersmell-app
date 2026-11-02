"use client";

import { useState } from "react";
import { Database, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import BookCover from "@/components/book-cover/book-cover";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import { fetchJson, getErrorMessage } from "@/lib/fetch-json";
import styles from "./biblionet-copy-form.module.css";
import type { BiblionetPreview } from "./biblionet-copy-form.types";

export default function BiblionetCopyForm() {
  const t = useTranslations("biblionetCopy");
  const [isbn, setIsbn] = useState("");
  const [preview, setPreview] = useState<BiblionetPreview | null>(null);
  const [busy, setBusy] = useState(false);

  async function fetchBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setPreview(null);
    try {
      const params = new URLSearchParams({ isbn });
      setPreview(
        await fetchJson<BiblionetPreview>(`/api/admin/biblionet?${params}`),
      );
    } catch (reason) {
      toast.error(getErrorMessage(reason, t("genericError")));
    } finally {
      setBusy(false);
    }
  }

  async function saveBook() {
    if (!preview?.book.isbn) return;
    setBusy(true);
    try {
      const { created } = await fetchJson<{ created: boolean }>(
        "/api/admin/biblionet",
        { method: "POST", json: { isbn: preview.book.isbn } },
      );
      toast.success(t(created ? "saved" : "updated"));
      setPreview({ ...preview, alreadyStored: true });
    } catch (reason) {
      toast.error(getErrorMessage(reason, t("genericError")));
    } finally {
      setBusy(false);
    }
  }

  const book = preview?.book;

  return (
    <section className={styles.section}>
      <form className={styles.form} onSubmit={(event) => void fetchBook(event)}>
        <TextInput
          label={t("isbn")}
          fieldClassName={styles.field}
          value={isbn}
          onChange={(event) => setIsbn(event.target.value)}
          inputMode="numeric"
          required
        />
        <Button type="submit" loading={busy}>
          <Search aria-hidden="true" />
          {t("fetch")}
        </Button>
      </form>
      {book && (
        <article className={styles.preview}>
          <BookCover className={styles.cover} src={book.coverUrl} />
          <div className={styles.details}>
            <h2 className={styles.bookTitle}>{book.title}</h2>
            {book.subtitle && <p>{book.subtitle}</p>}
            <dl className={styles.facts}>
              <dt>{t("authors")}</dt>
              <dd>{book.authors.join(", ") || "-"}</dd>
              <dt>{t("publisher")}</dt>
              <dd>{book.publisher ?? "-"}</dd>
              <dt>{t("isbn")}</dt>
              <dd>{book.isbn ?? "-"}</dd>
              <dt>{t("pages")}</dt>
              <dd>{book.pageCount || "-"}</dd>
              <dt>{t("published")}</dt>
              <dd>{book.publishedDate ?? "-"}</dd>
              <dt>{t("categories")}</dt>
              <dd>{book.categories.join(", ") || "-"}</dd>
            </dl>
            {book.description && (
              <p className={styles.description}>{book.description}</p>
            )}
            {preview.alreadyStored && (
              <p className={styles.stored}>{t("alreadyStored")}</p>
            )}
            <Button onClick={() => void saveBook()} loading={busy}>
              <Database aria-hidden="true" />
              {t(preview.alreadyStored ? "update" : "save")}
            </Button>
          </div>
        </article>
      )}
    </section>
  );
}
