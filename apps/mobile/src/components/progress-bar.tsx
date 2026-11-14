import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { radius, spacing } from "../lib/theme";
import { usePreferences } from "../providers/preferences-provider";
import { translateText } from "../lib/translation";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function ProgressBar({
  currentPage,
  pageCount,
}: {
  currentPage: number;
  pageCount: number;
}) {
  const { locale } = usePreferences();
  const styles = useThemedStyles(createStyles);
  if (pageCount <= 0) {
    return <Text style={styles.unknown}>{translateText(`Page ${currentPage}`, locale)}</Text>;
  }
  const clampedPage = Math.min(Math.max(currentPage, 0), pageCount);
  const percentage = Math.round((clampedPage / pageCount) * 100);
  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.label}>
          {translateText(`Page ${clampedPage} of ${pageCount}`, locale)}
        </Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
      <View
        accessibilityLabel={translateText(`Reading progress: ${percentage}%`, locale)}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: pageCount, now: clampedPage }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: spacing.xs, width: "100%" },
  labels: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  label: { color: colors.muted, fontSize: 12 },
  percentage: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  track: { height: 7, overflow: "hidden", borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.primary },
  unknown: { color: colors.muted, fontSize: 12 },
});
