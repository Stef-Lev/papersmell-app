import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { radius, spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";
import type {
  MessageValues,
  MobileMessageKey,
} from "../lib/translation";

export function MetricCard({
  labelKey,
  labelValues,
  value,
  detailKey,
}: {
  labelKey: MobileMessageKey;
  labelValues?: MessageValues;
  value: string | number;
  detailKey?: MobileMessageKey;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Text messageKey={labelKey} style={styles.label} values={labelValues} />
      <Text style={styles.value}>{value}</Text>
      {detailKey ? <Text messageKey={detailKey} style={styles.detail} /> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "46%",
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  value: { color: colors.text, fontSize: 26, fontWeight: "800" },
  detail: { color: colors.muted, fontSize: 12 },
});
