import { Pressable, ScrollView, StyleSheet } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import type { Shelf } from "../lib/types";
import { shelves } from "../lib/types";
import { radius, spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";
import { getShelfMessageKey } from "../lib/translation";

type Filter = Shelf | "all";

export function ShelfSelector({
  value,
  onChange,
  includeAll = false,
}: {
  value: Filter;
  onChange: (value: Filter) => void;
  includeAll?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const options: Filter[] = includeAll ? ["all", ...shelves] : shelves;
  return (
    <ScrollView
      contentContainerStyle={styles.list}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((shelf) => {
        const selected = shelf === value;
        const labelKey =
          shelf === "all" ? "mobile.common.allBooks" : getShelfMessageKey(shelf);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={shelf}
            onPress={() => onChange(shelf)}
            style={[styles.chip, selected && styles.selected]}
          >
            <Text
              messageKey={labelKey}
              style={[styles.label, selected && styles.selectedLabel]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  list: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  selectedLabel: { color: colors.white },
});
