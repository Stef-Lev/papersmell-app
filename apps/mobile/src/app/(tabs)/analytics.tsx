import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "../../components/localized-text";
import { router } from "expo-router";
import { AppButton } from "../../components/app-button";
import { BookCard } from "../../components/book-card";
import { EmptyState } from "../../components/empty-state";
import { LoadingState } from "../../components/loading-state";
import { MetricCard } from "../../components/metric-card";
import { Notice } from "../../components/notice";
import { OptionSelector } from "../../components/option-selector";
import { Panel } from "../../components/panel";
import { Screen } from "../../components/screen";
import { getLibraryStats, getValidFinishedAt } from "../../lib/library-stats";
import { spacing, type ThemeColors } from "../../lib/theme";
import { useLibrary } from "../../hooks/use-library";
import { useMemo, useState } from "react";
import { useThemedStyles } from "../../lib/use-themed-styles";
import { usePreferences } from "../../providers/preferences-provider";
import { translateText } from "../../lib/translation";

export default function AnalyticsScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = usePreferences();
  const { entries, collections, isLoading, error } = useLibrary();
  const currentYear = new Date().getUTCFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const years = useMemo(
    () =>
      [
        ...new Set([
          currentYear,
          ...entries.flatMap((entry) => {
            const date = getValidFinishedAt(entry);
            return date ? [date.getUTCFullYear()] : [];
          }),
        ]),
      ]
        .sort((first, second) => second - first)
        .map(String),
    [currentYear, entries],
  );
  const filteredEntries = useMemo(
    () =>
      selectedCollections.length
        ? entries.filter((entry) =>
            selectedCollections.some((id) => entry.collectionIds.includes(id)),
          )
        : entries,
    [entries, selectedCollections],
  );
  const stats = getLibraryStats(filteredEntries);
  const finishedEntries = filteredEntries.flatMap((entry) => {
    const date = getValidFinishedAt(entry);
    if (!date) return [];
    if (selectedYear !== "all" && date.getUTCFullYear() !== Number(selectedYear)) {
      return [];
    }
    return [{ entry, date }];
  });
  const missingPageCount = finishedEntries.filter(
    ({ entry }) => !Number.isFinite(entry.book.pageCount) || entry.book.pageCount <= 0,
  ).length;
  const missingFinishDate = filteredEntries.filter(
    (entry) => entry.status === "read" && !getValidFinishedAt(entry),
  ).length;
  const finishedPages = finishedEntries.reduce(
    (total, { entry }) =>
      total +
      (Number.isFinite(entry.book.pageCount) && entry.book.pageCount > 0
        ? entry.book.pageCount
        : 0),
    0,
  );
  const chartData =
    selectedYear === "all"
      ? [...new Set(finishedEntries.map(({ date }) => date.getUTCFullYear()))]
          .sort((first, second) => first - second)
          .map((year) => ({
            label: String(year),
            count: finishedEntries.filter(
              ({ date }) => date.getUTCFullYear() === year,
            ).length,
          }))
      : Array.from({ length: 12 }, (_, month) => {
          const year = Number(selectedYear);
          const count = finishedEntries.filter(
            ({ date }) =>
              date.getUTCFullYear() === year && date.getUTCMonth() === month,
          ).length;
          return {
            label: new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-US", {
              month: "short",
              timeZone: "UTC",
            }).format(new Date(Date.UTC(year, month, 1))),
            count,
          };
        });
  const maxMonthly = Math.max(1, ...chartData.map((item) => item.count));
  const averageRatingEntries = filteredEntries.filter((entry) => entry.rating !== null);
  const averageRating = averageRatingEntries.length
    ? (
        averageRatingEntries.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) /
        averageRatingEntries.length
      ).toFixed(1)
    : "—";

  if (isLoading) return <LoadingState />;
  return (
    <Screen title="Reading insights" subtitle="A snapshot of your reading year.">
      {error ? <Notice message={error} /> : null}
      <View style={styles.filters}>
        <OptionSelector
          label="Year"
          multiple={false}
          onChange={(values) => setSelectedYear(values[0] ?? String(currentYear))}
          options={[
            { value: "all", label: "All time" },
            ...years.map((year) => ({ value: year, label: year })),
          ]}
          selected={[selectedYear]}
        />
        <OptionSelector
          label="Collection"
          localizeOptions={false}
          multiple={false}
          onChange={setSelectedCollections}
          options={collections.map(({ id, name }) => ({ value: id, label: name }))}
          selected={selectedCollections}
        />
      </View>
      <AppButton
        label="Open reading calendar"
        onPress={() => router.push("/calendar")}
        variant="secondary"
      />
      <View style={styles.metrics}>
        <MetricCard
          label={
            selectedYear === "all"
              ? "Books finished"
              : `${translateText("Finished in", locale)} ${selectedYear}`
          }
          value={finishedEntries.length}
        />
        <MetricCard
          label="Pages in finished books"
          value={finishedPages.toLocaleString()}
        />
        <MetricCard label="Average rating" value={averageRating} detail="out of 5" />
        <MetricCard label="Library read" value={`${stats.readPercentage}%`} />
      </View>
      {missingPageCount || missingFinishDate ? (
        <Text style={styles.note}>
          {missingPageCount
            ? `${missingPageCount} finished ${missingPageCount === 1 ? "book has" : "books have"} no known page count. `
            : ""}
          {missingFinishDate
            ? `${missingFinishDate} read ${missingFinishDate === 1 ? "book has" : "books have"} no valid finish date and ${missingFinishDate === 1 ? "is" : "are"} excluded from time-based totals.`
            : ""}
        </Text>
      ) : null}
      <Panel style={styles.panel}>
        <View style={styles.heading}>
          <Text style={styles.title}>
            {selectedYear === "all" ? "Books finished by year" : "Books finished by month"}
          </Text>
          <Text style={styles.caption}>
            {selectedCollections.length
              ? translateText("Selected collection", locale)
              : selectedYear}
          </Text>
        </View>
        {chartData.map((item) => (
          <View key={item.label} style={styles.monthRow}>
            <Text style={styles.monthLabel}>{item.label}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { width: `${(item.count / maxMonthly) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.monthCount}>{item.count}</Text>
          </View>
        ))}
        <Text style={styles.note}>
          Completion counts use the finish dates recorded on your books.
        </Text>
      </Panel>
      <Panel style={styles.panel}>
        <Text style={styles.title}>Shelf overview</Text>
        {Object.entries(stats.shelfCounts).map(([shelf, count]) => (
          <View key={shelf} style={styles.shelfRow}>
            <Text style={styles.shelfLabel}>
              {shelf === "to-read"
                ? "To Read"
                : shelf === "currently-reading"
                  ? "Currently Reading"
                  : shelf === "did-not-finish"
                    ? "Did Not Finish"
                    : "Read"}
            </Text>
            <Text style={styles.monthCount}>{count}</Text>
          </View>
        ))}
      </Panel>
      <Panel style={styles.panel}>
        <Text style={styles.title}>Your highest rated</Text>
        {stats.topRated.length ? (
          stats.topRated.map((entry) => (
            <BookCard
              book={entry.book}
              key={entry.id}
              rating={entry.rating}
            />
          ))
        ) : (
          <EmptyState
            title="No ratings yet"
            description="Rate a finished book to see it here."
          />
        )}
      </Panel>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  filters: { gap: spacing.sm },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  panel: { gap: spacing.md },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  title: { color: colors.text, fontSize: 17, fontWeight: "800" },
  caption: { color: colors.muted, fontSize: 13 },
  monthRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  monthLabel: { width: 36, color: colors.muted, fontSize: 12 },
  barTrack: {
    flex: 1,
    height: 10,
    overflow: "hidden",
    borderRadius: 99,
    backgroundColor: colors.primarySoft,
  },
  bar: { height: "100%", borderRadius: 99, backgroundColor: colors.primary },
  monthCount: { width: 22, color: colors.text, fontSize: 13, fontWeight: "700", textAlign: "right" },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  shelfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  shelfLabel: { color: colors.text, fontSize: 14 },
});
