import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { radius, spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function Notice({
  message,
  variant = "error",
}: {
  message: string;
  variant?: "error" | "success";
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.notice, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  notice: { padding: spacing.md, borderRadius: radius.sm },
  error: { backgroundColor: colors.dangerSoft },
  success: { backgroundColor: colors.coralSoft },
  text: { fontSize: 14, lineHeight: 20 },
  errorText: { color: colors.danger },
  successText: { color: colors.muted },
});
