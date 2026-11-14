import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  View,
} from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { AppButton } from "./app-button";
import { Panel } from "./panel";
import { radius, spacing } from "../lib/theme";
import { usePreferences } from "../providers/preferences-provider";
import { translateText } from "../lib/translation";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export type SelectOption = { value: string; label: string };

export function OptionSelector({
  label,
  options,
  selected,
  onChange,
  multiple = true,
  emptyLabel = "Any",
  localizeOptions = true,
}: {
  label: string;
  options: readonly SelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  emptyLabel?: string;
  localizeOptions?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const { locale } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);
  const selectedLabel = selectedLabels.length
    ? selectedLabels
        .map((value) => localizeOptions ? translateText(value, locale) : value)
        .join(", ")
    : translateText(emptyLabel, locale);
  const localizedLabel = translateText(label, locale);

  function toggle(value: string) {
    if (!multiple) {
      onChange(selected.includes(value) ? [] : [value]);
      setVisible(false);
      return;
    }
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${localizedLabel}: ${selectedLabel}`}
        onPress={() => setVisible(true)}
        style={styles.trigger}
      >
        <Text style={styles.triggerLabel}>{localizedLabel}</Text>
        <NativeText numberOfLines={1} style={styles.triggerValue}>
          {selectedLabel}
        </NativeText>
      </Pressable>
      <Modal
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}
      >
        <View style={styles.backdrop}>
          <Panel style={styles.modal}>
            <Text style={styles.title}>{label}</Text>
            <ScrollView style={styles.options}>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    key={option.value}
                    onPress={() => toggle(option.value)}
                    style={styles.option}
                  >
                    {localizeOptions ? (
                      <Text style={styles.optionLabel}>{option.label}</Text>
                    ) : (
                      <NativeText style={styles.optionLabel}>{option.label}</NativeText>
                    )}
                    <Text style={styles.check}>{isSelected ? "✓" : ""}</Text>
                  </Pressable>
                );
              })}
              {options.length === 0 ? (
                <Text style={styles.empty}>No options available yet.</Text>
              ) : null}
            </ScrollView>
            <View style={styles.actions}>
              <AppButton
                label="Clear"
                onPress={() => {
                  onChange([]);
                  if (!multiple) setVisible(false);
                }}
                variant="secondary"
              />
              <AppButton label="Done" onPress={() => setVisible(false)} />
            </View>
          </Panel>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  trigger: {
    minHeight: 44,
    gap: spacing.xs,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  triggerLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  triggerValue: { color: colors.text, fontSize: 14, fontWeight: "600" },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#00000066",
    padding: spacing.md,
  },
  modal: { maxHeight: "82%", gap: spacing.md },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  options: { flexGrow: 0 },
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionLabel: { flex: 1, color: colors.text, fontSize: 15 },
  check: { width: 28, color: colors.primary, fontSize: 18, fontWeight: "800" },
  empty: { color: colors.muted, paddingVertical: spacing.lg },
  actions: { flexDirection: "row", gap: spacing.md },
});
