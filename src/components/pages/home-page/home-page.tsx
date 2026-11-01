import { getTranslations } from "next-intl/server";
import Link from "@/components/navigation-link/navigation-link";
import Image from "next/image";
import { ArrowRight, Library, Search } from "lucide-react";
import styles from "./home-page.module.css";

export default async function HomePage() {
  const t = await getTranslations("pages.home");
  const nav = await getTranslations("nav");

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <Image
          src="/papersmell-logo.svg"
          alt=""
          width={96}
          height={96}
          priority
          className={styles.heroLogo}
        />
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </section>
      <div className={styles.cards}>
        <Link href="/library" className={styles.card}>
          <Library className={styles.cardIcon} aria-hidden="true" />
          <span>{nav("library")}</span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/search" className={styles.card}>
          <Search className={styles.cardIcon} aria-hidden="true" />
          <span>{nav("searchLabel")}</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
