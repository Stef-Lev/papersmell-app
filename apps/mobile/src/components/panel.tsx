import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { radius, spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.panel, style]}>{children}</View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  panel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
});
