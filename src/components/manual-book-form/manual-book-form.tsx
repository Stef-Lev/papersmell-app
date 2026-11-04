"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import type { BookInput } from "@/lib/book-input";
import styles from "./manual-book-form.module.css";
import type { ManualBookFormProps } from "./manual-book-form.types";

function toBookInput(form: FormData): BookInput {
  const author = String(form.get("author") ?? "").trim();
  return {
    title: String(form.get("title") ?? "").trim(),
    authors: author ? [author] : [],
    isbn: String(form.get("isbn") ?? "").trim() || undefined,
    pageCount: Number(form.get("pageCount") ?? 0) || 0,
    categories: String(form.get("categories") ?? "")
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean),
    coverUrl: String(form.get("coverUrl") ?? "").trim() || undefined,
  };
}

export default function ManualBookForm({
  submitLabel,
  disabled,
  onSubmit,
}: ManualBookFormProps) {
  const t = useTranslations("libraryWorkspace");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (await onSubmit(toBookInput(new FormData(formElement)))) {
      formElement.reset();
    }
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
      <TextInput
        label={t("titleField")}
        fieldClassName={styles.field}
        name="title"
        required
        maxLength={300}
      />
      <TextInput label={t("author")} fieldClassName={styles.field} name="author" />
      <TextInput label={t("isbn")} fieldClassName={styles.field} name="isbn" />
      <TextInput
        label={t("pages")}
        fieldClassName={styles.field}
        name="pageCount"
        type="number"
        min="0"
        step="1"
      />
      <TextInput
        label={t("categories")}
        fieldClassName={styles.field}
        name="categories"
        placeholder={t("categoryHint")}
      />
      <TextInput
        label={t("coverUrl")}
        fieldClassName={styles.field}
        name="coverUrl"
        type="url"
      />
      <Button type="submit" disabled={disabled}>
        {submitLabel}
      </Button>
    </form>
  );
}
