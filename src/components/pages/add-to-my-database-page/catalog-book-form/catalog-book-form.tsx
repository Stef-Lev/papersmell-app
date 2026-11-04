"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import ManualBookForm from "@/components/manual-book-form/manual-book-form";
import type { BookInput } from "@/lib/book-input";
import { fetchJson, getErrorMessage } from "@/lib/fetch-json";
import styles from "./catalog-book-form.module.css";

export default function CatalogBookForm() {
  const t = useTranslations("catalogBookAdd");
  const [busy, setBusy] = useState(false);

  async function saveBook(book: BookInput) {
    setBusy(true);
    try {
      await fetchJson("/api/admin/books", { method: "POST", json: book });
      toast.success(t("saved"));
      return true;
    } catch (reason) {
      toast.error(getErrorMessage(reason, t("genericError")));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section}>
      <ManualBookForm
        submitLabel={t("save")}
        disabled={busy}
        onSubmit={saveBook}
      />
    </section>
  );
}
