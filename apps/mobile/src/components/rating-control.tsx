import { Pressable, StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { radius, spacing } from "../lib/theme";
import { usePreferences } from "../providers/preferences-provider";
import { translateText } from "../lib/translation";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function RatingControl({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const { locale } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const display = value === null ? "Not rated" : `${value.toFixed(1)} / 5`;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your rating</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={translateText("Decrease rating by half a star", locale)}
          accessibilityRole="button"
          disabled={value === null || value <= 1}
          onPress={() => onChange(value === null ? null : Math.max(1, value - 0.5))}
          style={styles.adjust}
        >
          <Text style={styles.adjustLabel}>−</Text>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={styles.rating}>
          {display}
        </Text>
        <Pressable
          accessibilityLabel={translateText(value === null ? "Set rating to one star" : "Increase rating by half a star", locale)}
          accessibilityRole="button"
          disabled={value !== null && value >= 5}
          onPress={() => onChange(value === null ? 1 : Math.min(5, value + 0.5))}
          style={styles.adjust}
        >
          <Text style={styles.adjustLabel}>+</Text>
        </Pressable>
        {value !== null ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange(null)}
            style={styles.clear}
          >
            <Text style={styles.clearLabel}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  adjust: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  adjustLabel: { color: colors.primary, fontSize: 22, fontWeight: "700" },
  rating: { minWidth: 90, color: colors.text, textAlign: "center", fontSize: 15 },
  clear: { padding: spacing.sm },
  clearLabel: { color: colors.muted, fontSize: 13, textDecorationLine: "underline" },
});
