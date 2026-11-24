import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from "react-native";
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
  variant?: "primary" | "secondary" | "danger";
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
}: Props) {
  const { colors } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;
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
        <ActivityIndicator
          color={
            variant === "primary"
              ? colors.white
              : variant === "danger"
                ? colors.danger
                : colors.primary
          }
        />
      ) : (
        <Text messageKey={label} style={[styles.label, styles[`${variant}Label`]]} />
      )}
    </Pressable>
  );
}

const createStyles = (colors: import("../lib/theme").ThemeColors) => StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  danger: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: { fontSize: 15, fontWeight: "700" },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.primary },
  dangerLabel: { color: colors.danger },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.82 },
});
