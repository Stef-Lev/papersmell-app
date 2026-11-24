import { ActivityIndicator, StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { spacing } from "../lib/theme";
import { usePreferences } from "../providers/preferences-provider";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";
import type { MobileMessageKey } from "../lib/translation";

export function LoadingState({
  label = "mobile.common.loadingBooks",
}: {
  label?: MobileMessageKey;
}) {
  const { colors } = usePreferences();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text messageKey={label} style={styles.label} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  label: { color: colors.muted, fontSize: 14 },
});
