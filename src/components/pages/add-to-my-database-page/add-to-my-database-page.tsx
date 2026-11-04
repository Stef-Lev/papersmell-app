import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isAdminSession } from "@/lib/admin";
import CatalogBookForm from "./catalog-book-form/catalog-book-form";
import styles from "./add-to-my-database-page.module.css";

export default async function AddToMyDatabasePage() {
  if (!(await isAdminSession())) notFound();
  const t = await getTranslations("catalogBookAdd");

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>
      <CatalogBookForm />
    </main>
  );
}
