import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";
import type { MobileMessageKey } from "../lib/translation";

export function EmptyState({
  titleKey,
  descriptionKey,
}: {
  titleKey: MobileMessageKey;
  descriptionKey?: MobileMessageKey;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.mark}>P</Text>
      <Text messageKey={titleKey} style={styles.title} />
      {descriptionKey ? (
        <Text messageKey={descriptionKey} style={styles.description} />
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  mark: { color: colors.accent, fontSize: 34, fontWeight: "800" },
  title: { color: colors.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
});
