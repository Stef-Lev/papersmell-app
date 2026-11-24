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
import { getShelfMessageKey, translateMessage } from "../../lib/translation";
import { shelves } from "../../lib/types";
import { usePreferences } from "../../providers/preferences-provider";

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
      bottomNavigation
      titleKey="mobile.home.greeting"
      titleValues={{
        name:
          session?.user.name.split(" ")[0] ||
          translateMessage("mobile.home.reader", locale),
      }}
      subtitleKey="mobile.home.subtitle"
    >
      {error ? (
        <Panel>
          <Notice message={error} />
          <AppButton label="mobile.home.tryAgain" onPress={refresh} variant="secondary" />
        </Panel>
      ) : null}
      <View style={styles.metrics}>
        <MetricCard labelKey="mobile.home.inLibrary" value={stats.total} />
        <MetricCard labelKey="mobile.home.markedRead" value={`${stats.readPercentage}%`} />
      </View>
      <Panel style={styles.overview}>
        <View style={styles.sectionHeading}>
          <Text messageKey="mobile.home.yourShelves" style={styles.sectionTitle} />
          <Text messageKey="mobile.home.shelfSnapshot" style={styles.sectionCaption} />
        </View>
        {shelves.map((shelf) => (
          <View key={shelf} style={styles.shelfRow}>
            <Text messageKey={getShelfMessageKey(shelf)} style={styles.shelfLabel} />
            <Text style={styles.shelfCount}>{stats.shelfCounts[shelf]}</Text>
          </View>
        ))}
        <AppButton
          label="mobile.home.openLibrary"
          onPress={() => router.push("/(tabs)/library")}
          variant="secondary"
        />
      </Panel>
      <View style={styles.sectionHeading}>
        <Text messageKey="mobile.home.currentlyReading" style={styles.sectionTitle} />
        <Text messageKey="mobile.home.pickUpReading" style={styles.sectionCaption} />
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
            titleKey="mobile.home.emptyReading"
            descriptionKey="mobile.home.emptyReadingDescription"
          />
          <AppButton
            label="mobile.home.findBook"
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
