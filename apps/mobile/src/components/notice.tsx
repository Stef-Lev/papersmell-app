import { StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { radius, spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";
import type {
  MessageValues,
  MobileMessageKey,
} from "../lib/translation";

export function Notice({
  message,
  messageKey,
  values,
  variant = "error",
}: {
  message?: string;
  messageKey?: MobileMessageKey;
  values?: MessageValues;
  variant?: "error" | "success";
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.notice, styles[variant]]}>
      {messageKey ? (
        <Text
          messageKey={messageKey}
          style={[styles.text, styles[`${variant}Text`]]}
          values={values}
        />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{message}</Text>
      )}
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
