import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "../../components/localized-text";
import { AppButton } from "../../components/app-button";
import { BookCard } from "../../components/book-card";
import { EmptyState } from "../../components/empty-state";
import { MetricCard } from "../../components/metric-card";
import { Notice } from "../../components/notice";
import { Panel } from "../../components/panel";
import { Screen } from "../../components/screen";
import { LoadingState } from "../../components/loading-state";
import { getLibraryStats } from "../../lib/library-stats";
import { spacing, type ThemeColors } from "../../lib/theme";
import { useThemedStyles } from "../../lib/use-themed-styles";
import { useAuth } from "../../providers/auth-provider";
import { useLibrary } from "../../hooks/use-library";
import { usePreferences } from "../../providers/preferences-provider";
import { translateText } from "../../lib/translation";

export default function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  const { session } = useAuth();
  const { locale } = usePreferences();
  const { entries, isLoading, error, refresh } = useLibrary();
  const stats = getLibraryStats(entries);
  const reading = entries.filter((entry) => entry.status === "currently-reading");

  if (isLoading) return <LoadingState />;
  return (
    <Screen
      title={translateText(
        `Hello, ${session?.user.name.split(" ")[0] || "reader"}.`,
        locale,
      )}
      subtitle="A little space for the books you love."
    >
      {error ? (
        <Panel>
          <Notice message={error} />
          <AppButton label="Try again" onPress={refresh} variant="secondary" />
        </Panel>
      ) : null}
      <View style={styles.metrics}>
        <MetricCard label="In your library" value={stats.total} />
        <MetricCard label="Marked read" value={`${stats.readPercentage}%`} />
      </View>
      <Panel style={styles.overview}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your shelves</Text>
          <Text style={styles.sectionCaption}>A snapshot of your library</Text>
        </View>
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
            <Text style={styles.shelfCount}>{count}</Text>
          </View>
        ))}
        <AppButton
          label="Open my library"
          onPress={() => router.push("/(tabs)/library")}
          variant="secondary"
        />
      </Panel>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Currently reading</Text>
        <Text style={styles.sectionCaption}>Pick up where you left off</Text>
      </View>
      {reading.length ? (
        reading.slice(0, 3).map((entry) => (
          <BookCard
            book={entry.book}
            currentPage={entry.currentPage}
            key={entry.id}
            onPress={() =>
              router.push({ pathname: "/book/[id]", params: { id: entry.id } })
            }
          />
        ))
      ) : (
        <Panel>
          <EmptyState
            title="Nothing on your reading desk yet"
            description="Choose a book from your library or discover something new."
          />
          <AppButton
            label="Find a book"
            onPress={() => router.push("/(tabs)/search")}
          />
        </Panel>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  overview: { gap: spacing.md },
  sectionHeading: { gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "800" },
  sectionCaption: { color: colors.muted, fontSize: 13 },
  shelfRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  shelfLabel: { color: colors.text, fontSize: 14 },
  shelfCount: { color: colors.primary, fontSize: 14, fontWeight: "700" },
});
