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
import {
  translateMessage,
  type MobileMessageKey,
} from "../lib/translation";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export type SelectOption =
  | { value: string; label: string; messageKey?: never }
  | { value: string; label?: never; messageKey: MobileMessageKey };

export function OptionSelector({
  labelKey,
  options,
  selected,
  onChange,
  multiple = true,
  emptyLabelKey = "mobile.common.any",
}: {
  labelKey: MobileMessageKey;
  options: readonly SelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  emptyLabelKey?: MobileMessageKey;
}) {
  const [visible, setVisible] = useState(false);
  const { locale } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) =>
      option.messageKey
        ? translateMessage(option.messageKey, locale)
        : option.label,
    );
  const selectedLabel = selectedLabels.length
    ? selectedLabels.join(", ")
    : translateMessage(emptyLabelKey, locale);
  const localizedLabel = translateMessage(labelKey, locale);

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
            <Text messageKey={labelKey} style={styles.title} />
            <ScrollView style={styles.options}>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                const optionLabel = option.messageKey
                  ? translateMessage(option.messageKey, locale)
                  : option.label;
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    key={option.value}
                    onPress={() => toggle(option.value)}
                    style={styles.option}
                  >
                    <NativeText style={styles.optionLabel}>{optionLabel}</NativeText>
                    <Text style={styles.check}>{isSelected ? "✓" : ""}</Text>
                  </Pressable>
                );
              })}
              {options.length === 0 ? (
                <Text messageKey="mobile.selector.noOptions" style={styles.empty} />
              ) : null}
            </ScrollView>
            <View style={styles.actions}>
              <AppButton
                label="mobile.selector.clear"
                onPress={() => {
                  onChange([]);
                  if (!multiple) setVisible(false);
                }}
                variant="secondary"
              />
              <AppButton
                label="mobile.selector.done"
                onPress={() => setVisible(false)}
              />
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
