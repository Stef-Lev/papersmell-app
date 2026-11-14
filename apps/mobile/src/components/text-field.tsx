import { StyleSheet, TextInput, View } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { radius, spacing } from "../lib/theme";
import { usePreferences } from "../providers/preferences-provider";
import { translateText } from "../lib/translation";
import { useThemedStyles } from "../lib/use-themed-styles";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  error?: string;
  multiline?: boolean;
  maxLength?: number;
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "sentences",
  error,
  multiline,
  maxLength,
  onSubmitEditing,
}: Props) {
  const { colors, locale } = usePreferences();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={translateText(label, locale)}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder ? translateText(placeholder, locale) : undefined}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.multiline, error && styles.invalid]}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: import("../lib/theme").ThemeColors) => StyleSheet.create({
  field: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 14, fontWeight: "600" },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  multiline: { minHeight: 112, paddingTop: spacing.md, textAlignVertical: "top" },
  invalid: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
});
