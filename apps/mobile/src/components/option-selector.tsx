import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  View,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
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
  const { colors, locale } = usePreferences();
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
      <View style={styles.field}>
        <Text messageKey={labelKey} style={styles.label} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${localizedLabel}: ${selectedLabel}`}
          onPress={() => setVisible(true)}
          style={styles.trigger}
        >
          <NativeText numberOfLines={1} style={styles.triggerValue}>
            {selectedLabel}
          </NativeText>
          <ChevronDown color={colors.muted} size={16} />
        </Pressable>
      </View>
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
                variant="outline"
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
  field: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 14, fontWeight: "500" },
  trigger: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.background,
  },
  triggerValue: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "400",
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#00000066",
    padding: spacing.md,
  },
  modal: { maxHeight: "82%", gap: spacing.md, borderRadius: radius.xl },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  options: { flexGrow: 0 },
  option: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderRadius: radius.lg,
  },
  optionLabel: { flex: 1, color: colors.text, fontSize: 14 },
  check: { width: 28, color: colors.primary, fontSize: 18, fontWeight: "800" },
  empty: { color: colors.muted, paddingVertical: spacing.lg },
  actions: { flexDirection: "row", gap: spacing.md },
});
