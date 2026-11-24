import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";
import { LocalizedText as Text } from "./localized-text";
import { radius, spacing } from "../lib/theme";
import { usePreferences } from "../providers/preferences-provider";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { MobileMessageKey } from "../lib/translation";

type Props = {
  label: MobileMessageKey;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "destructive";
  icon?: ReactNode;
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  icon,
  style,
}: Props) {
  const { colors } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;
  const activityColor =
    variant === "primary"
      ? colors.primaryContrast
      : variant === "secondary"
        ? colors.secondaryContrast
        : variant === "destructive"
          ? colors.danger
          : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={activityColor} />
      ) : (
        <View style={styles.buttonContent}>
          {icon}
          <Text messageKey={label} style={[styles.label, styles[`${variant}Label`]]} />
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors: import("../lib/theme").ThemeColors) => StyleSheet.create({
  button: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radius.xl,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.primary },
  outline: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  destructive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  label: { flexShrink: 1, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  primaryLabel: { color: colors.primaryContrast },
  outlineLabel: { color: colors.text },
  secondaryLabel: { color: colors.secondaryContrast },
  destructiveLabel: { color: colors.danger },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.82 },
});
