import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import BiblionetCopyForm from "@/components/biblionet-copy-form/biblionet-copy-form";
import { isAdminSession } from "@/lib/admin";
import styles from "./copy-to-my-database-page.module.css";

export default async function CopyToMyDatabasePage() {
  if (!(await isAdminSession())) notFound();
  const t = await getTranslations("biblionetCopy");

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.intro}>{t("intro")}</p>
      <BiblionetCopyForm />
    </main>
  );
}
