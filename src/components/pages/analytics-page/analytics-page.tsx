import mongoose from "mongoose";
import Link from "@/components/navigation-link/navigation-link";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import BookCover from "@/components/book-cover/book-cover";
import StarRating from "@/components/star-rating/star-rating";
import YearFilter from "@/components/pages/analytics-page/year-filter/year-filter";
import ReadingOverTime from "@/components/pages/analytics-page/reading-over-time/reading-over-time";
import CollectionFilter from "@/components/pages/analytics-page/collection-filter/collection-filter";
import { connectDB } from "@/lib/mongodb";
import { requireSessionUser } from "@/lib/require-session-user";
import { SHELVES, Shelf } from "@/lib/shelves";
import "@/models/Book";
import UserBook from "@/models/UserBook";
import Collection from "@/models/Collection";
import styles from "./analytics-page.module.css";
import type { AnalyticsPageProps } from "./analytics-page.types";

type BookDetails = {
  title: string;
  authors: string[];
  pageCount: number;
  coverUrl?: string;
};

type YearFilter = number | "all";

function validDate(value: Date | null | undefined): Date | null {
  return value instanceof Date && Number.isFinite(value.getTime())
    ? value
    : null;
}

function getYearFilter(
  value: string | undefined,
  currentYear: number,
  minYear: number,
): YearFilter {
  if (value === "all") return "all";
  if (!value || !/^\d{4}$/.test(value)) return currentYear;
  const year = Number(value);
  return year >= minYear && year <= currentYear ? year : currentYear;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  // Session access and the date math below are request-time only; keep them out of prerender.
  await connection();
  const [{ year: yearParam }, sessionUser, t, locale] = await Promise.all([
    searchParams,
    requireSessionUser(),
    getTranslations("pages.analytics"),
    getLocale(),
  ]);
  const userId = sessionUser.id;

  await connectDB();
  const entries = await UserBook.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .populate<{ bookId: BookDetails | null }>({
      path: "bookId",
      select: "title authors pageCount coverUrl",
    })
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const readEntries = entries.filter((entry) => entry.status === Shelf.Read);
  const allFinished = readEntries.flatMap((entry) => {
    const finishedAt = validDate(entry.finishedAt);
    const startedAt = validDate(entry.startedAt);
    if (
      !finishedAt ||
      finishedAt.getTime() > now.getTime() ||
      (startedAt && startedAt.getTime() > finishedAt.getTime())
    ) {
      return [];
    }
    return [{ entry, finishedAt }];
  });
  const missingOrInconsistentDates = readEntries.length - allFinished.length;

  const minYear = allFinished.reduce(
    (earliest, { finishedAt }) =>
      Math.min(earliest, finishedAt.getUTCFullYear()),
    currentYear,
  );
  const year = getYearFilter(
    Array.isArray(yearParam) ? undefined : yearParam,
    currentYear,
    minYear,
  );
  const selectedCompletions =
    year === "all"
      ? allFinished
      : allFinished.filter(
          ({ finishedAt }) => finishedAt.getUTCFullYear() === year,
        );
  const completedPages = selectedCompletions.reduce((sum, { entry }) => {
    const pageCount = entry.bookId?.pageCount ?? 0;
    return pageCount > 0 && Number.isFinite(pageCount) ? sum + pageCount : sum;
  }, 0);
  const completedBooksMissingPages = selectedCompletions.filter(({ entry }) => {
    const pageCount = entry.bookId?.pageCount ?? 0;
    return !Number.isFinite(pageCount) || pageCount <= 0;
  }).length;
  const completionYear = year === "all" ? currentYear : year;
  const startYear = year === "all" ? minYear : completionYear;
  const completionCounts = new Map<string, number>();
  for (const { finishedAt } of selectedCompletions) {
    const key = `${finishedAt.getUTCFullYear()}-${finishedAt.getUTCMonth()}`;
    completionCounts.set(key, (completionCounts.get(key) ?? 0) + 1);
  }
  const months = [];
  for (
    let date = new Date(Date.UTC(startYear, 0, 1));
    date <= new Date(Date.UTC(currentYear, now.getUTCMonth(), 1));
    date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  ) {
    if (year !== "all" && date.getUTCFullYear() !== year) continue;
    const count =
      completionCounts.get(`${date.getUTCFullYear()}-${date.getUTCMonth()}`) ??
      0;
    months.push({
      year: date.getUTCFullYear(),
      label: new Intl.DateTimeFormat(locale, {
        month: "short",
        timeZone: "UTC",
      }).format(date),
      count,
    });
  }

  const shelfCounts = Object.fromEntries(
    SHELVES.map((shelf) => [
      shelf,
      entries.filter((entry) => entry.status === shelf).length,
    ]),
  ) as Record<Shelf, number>;
  const librarySize = entries.length;
  const readPercentage =
    librarySize > 0 ? Math.round((shelfCounts.read / librarySize) * 100) : 0;
  
  // Fetch user's collections
  const collections = await Collection.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ name: 1 })
    .lean();

  // Calculate collection statistics
  const collectionStats = collections.map((collection) => {
    const booksInCollection = entries.filter((entry) =>
      entry.collectionIds.some((id) => id.toString() === collection._id.toString()),
    );
    const readInCollection = booksInCollection.filter(
      (entry) => entry.status === Shelf.Read,
    ).length;
    const totalInCollection = booksInCollection.length;
    return {
      id: collection._id.toString(),
      name: collection.name,
      total: totalInCollection,
      read: readInCollection,
      percentage: totalInCollection > 0 ? Math.round((readInCollection / totalInCollection) * 100) : 0,
    };
  });

  const currentlyReading = shelfCounts[Shelf.CurrentlyReading];
  const favorites = entries
    .flatMap((entry) => {
      const book = entry.bookId;
      const rating = entry.rating;
      if (!book?.title || typeof rating !== "number" || rating <= 0) return [];
      return [{ id: entry._id.toString(), book, rating }];
    })
    .sort((a, b) => {
      const ratingDifference = b.rating - a.rating;
      return (
        ratingDifference || a.book.title.localeCompare(b.book.title, locale)
      );
    })
    .slice(0, 5);
  const yearOptions = Array.from(
    { length: currentYear - minYear + 1 },
    (_, index) => currentYear - index,
  );
  const periodLabel = year === "all" ? t("allTime") : String(year);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.description}>{t("description")}</p>
        </div>
        <YearFilter year={year} years={yearOptions} />
      </header>

      <section className={styles.summary} aria-label={t("summary")}>
        <article className={styles.metric}>
          <p className={styles.metricLabel}>{t("booksFinished")}</p>
          <p className={styles.metricValue}>{selectedCompletions.length}</p>
          <p className={styles.metricContext}>{periodLabel}</p>
        </article>
        <article className={styles.metric}>
          <p className={styles.metricLabel}>{t("pagesInFinishedBooks")}</p>
          <p className={styles.metricValue}>
            {completedPages.toLocaleString(locale)}
          </p>
          <p className={styles.metricContext}>
            {t("knownPageCounts", { count: completedBooksMissingPages })}
          </p>
        </article>
        <article className={styles.metric}>
          <p className={styles.metricLabel}>{t("currentlyReading")}</p>
          <p className={styles.metricValue}>{currentlyReading}</p>
          <Link className={styles.metricLink} href="/library">
            {t("viewLibrary")}
          </Link>
        </article>
      </section>

      <CollectionFilter collections={collectionStats} />

      <div className={styles.sections}>
        <section className={styles.panel} aria-labelledby="reading-over-time">
          <ReadingOverTime months={months} year={year} />
          <p className={styles.dataNote}>
            {t("invalidCompletionDates", { count: missingOrInconsistentDates })}
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="library-overview">
          <div className={styles.panelHeading}>
            <h2 id="library-overview">{t("libraryOverview")}</h2>
            <p>{t("currentShelfSnapshot")}</p>
          </div>
          {librarySize === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyMessage}>{t("emptyLibrary")}</p>
              <Link href="/search">{t("findBooks")}</Link>
            </div>
          ) : (
            <>
              <div className={styles.readProgress}>
                <div className={styles.progressLabel}>
                  <span>{t("libraryReadPercentage")}</span>
                  <strong>{readPercentage}%</strong>
                </div>
                <progress
                  className={styles.libraryProgress}
                  max={librarySize}
                  value={shelfCounts.read}
                  aria-label={t("readBooksOutOfTotal", {
                    read: shelfCounts.read,
                    total: librarySize,
                  })}
                />
              </div>
              <ul className={styles.shelfList}>
                {SHELVES.map((shelf) => (
                  <li className={styles.shelfRow} key={shelf}>
                    <span>{t(`shelves.${shelf}`)}</span>
                    <span className={styles.shelfCount}>
                      {shelfCounts[shelf]}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="favorite-books">
          <div className={styles.panelHeading}>
            <h2 id="favorite-books">{t("yourFavorites")}</h2>
            <p>{t("favoriteBooksDescription")}</p>
          </div>
          {favorites.length === 0 ? (
            <p className={styles.emptyMessage}>{t("noRatedBooks")}</p>
          ) : (
            <ul className={styles.favoriteList}>
              {favorites.map(({ id, book, rating }) => {
                return (
                  <li className={styles.favorite} key={id}>
                    <BookCover
                      className={styles.cover}
                      src={book.coverUrl}
                      alt={book.title}
                    />
                    <div className={styles.favoriteDetails}>
                      <h3>{book.title}</h3>
                      <p>
                        {book.authors.length > 0
                          ? book.authors.join(", ")
                          : t("unknownAuthor")}
                      </p>
                      <StarRating
                        label={t("ratingOutOfFive", { rating })}
                        value={rating}
                        readOnly
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
