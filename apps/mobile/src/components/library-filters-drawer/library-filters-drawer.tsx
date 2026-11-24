import { ArrowDownUp, X } from "lucide-react-native";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  View,
} from "react-native";
import { AppButton } from "../app-button";
import { LocalizedText as Text } from "../localized-text";
import { radius, spacing, type ThemeColors } from "../../lib/theme";
import { useThemedStyles } from "../../lib/use-themed-styles";
import { usePreferences } from "../../providers/preferences-provider";
import { translateMessage } from "../../lib/translation";
import type { LibraryFilterSectionKey } from "../../lib/library-filters";
import type { LibraryFiltersDrawerProps } from "./library-filters-drawer.types";

function isOptionSelected(
  filters: LibraryFiltersDrawerProps["draftFilters"],
  section: LibraryFilterSectionKey,
  value: string,
) {
  switch (section) {
    case "sortBy":
      return filters.sortBy === value;
    case "shelf":
      return filters.shelves.some((shelf) => shelf === value);
    case "author":
      return filters.authors.includes(value);
    case "category":
      return filters.categories.includes(value);
    case "collection":
      return filters.collectionIds.includes(value);
  }
}

export function LibraryFiltersDrawer({
  visible,
  activeSection,
  sections,
  optionsBySection,
  draftFilters,
  resultCount,
  onClose,
  onSectionChange,
  onToggleOption,
  onClear,
  onApply,
}: LibraryFiltersDrawerProps) {
  const styles = useThemedStyles(createStyles);
  const { colors, locale } = usePreferences();
  const activeOptions = optionsBySection[activeSection];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel={translateMessage("mobile.library.closeFilters", locale)}
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <NativeText style={styles.drawerTitle}>
              {translateMessage("mobile.library.filter", locale)}
            </NativeText>
            <Pressable
              accessibilityLabel={translateMessage("mobile.library.closeFilters", locale)}
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X color={colors.text} size={20} />
            </Pressable>
          </View>
          <View style={styles.drawerBody}>
            <View style={styles.sectionTabs}>
              {sections.map((section) => {
                const isActive = activeSection === section.key;
                const hasSelection =
                  section.key === "shelf"
                    ? draftFilters.shelves.length > 0
                    : section.key === "author"
                      ? draftFilters.authors.length > 0
                      : section.key === "category"
                        ? draftFilters.categories.length > 0
                        : section.key === "collection"
                          ? draftFilters.collectionIds.length > 0
                          : false;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    key={section.key}
                    onPress={() => onSectionChange(section.key)}
                    style={[styles.sectionTab, isActive && styles.sectionTabActive]}
                  >
                    {section.key === "sortBy" ? (
                      <ArrowDownUp color={isActive ? colors.primary : colors.muted} size={16} />
                    ) : hasSelection ? (
                      <View style={styles.activeDot} />
                    ) : (
                      <View style={styles.inactiveDot} />
                    )}
                    <NativeText
                      numberOfLines={1}
                      style={[styles.sectionTabText, isActive && styles.sectionTabTextActive]}
                    >
                      {translateMessage(section.labelKey, locale)}
                    </NativeText>
                  </Pressable>
                );
              })}
            </View>
            <ScrollView
              contentContainerStyle={styles.optionListContent}
              style={styles.optionList}
            >
              {activeOptions.map((option) => {
                const selected = isOptionSelected(
                  draftFilters,
                  activeSection,
                  option.value,
                );
                const isMultiSelect = activeSection !== "sortBy";
                return (
                  <Pressable
                    accessibilityLabel={
                      option.count === undefined
                        ? option.label
                        : `${option.label}, ${option.count}`
                    }
                    accessibilityRole={isMultiSelect ? "checkbox" : "radio"}
                    accessibilityState={
                      isMultiSelect
                        ? { checked: selected }
                        : { selected }
                    }
                    key={option.value}
                    onPress={() => onToggleOption(activeSection, option.value)}
                    style={styles.optionRow}
                  >
                    <View
                      style={[
                        styles.optionIndicator,
                        selected && styles.optionIndicatorSelected,
                        !isMultiSelect && styles.radioIndicator,
                      ]}
                    >
                      {selected ? (
                        isMultiSelect ? (
                          <NativeText style={styles.checkmark}>✓</NativeText>
                        ) : (
                          <View style={styles.radioDot} />
                        )
                      ) : null}
                    </View>
                    <NativeText numberOfLines={2} style={styles.optionLabel}>
                      {option.label}
                    </NativeText>
                    {option.count !== undefined ? (
                      <NativeText style={styles.optionCount}>{option.count}</NativeText>
                    ) : null}
                  </Pressable>
                );
              })}
              {activeOptions.length === 0 ? (
                <Text messageKey="mobile.selector.noOptions" style={styles.noOptions} />
              ) : null}
            </ScrollView>
          </View>
          <View style={styles.drawerFooter}>
            <AppButton
              label="mobile.library.clearFilters"
              onPress={onClear}
              style={styles.footerButton}
              variant="secondary"
            />
            <Pressable
              accessibilityLabel={`${translateMessage(
                "mobile.library.apply",
                locale,
              )}, ${resultCount}`}
              accessibilityRole="button"
              onPress={onApply}
              style={styles.applyButton}
            >
              <NativeText style={styles.applyButtonText}>
                {translateMessage("mobile.library.apply", locale)}
              </NativeText>
              <View style={styles.applyCountBadge}>
                <NativeText style={styles.applyCountText}>{resultCount}</NativeText>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#00000066",
  },
  drawer: {
    height: "78%",
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.surface,
  },
  drawerHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  drawerBody: { flex: 1, flexDirection: "row", minHeight: 0 },
  sectionTabs: {
    width: 120,
    gap: spacing.xs,
    paddingEnd: spacing.sm,
  },
  sectionTab: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  sectionTabActive: { backgroundColor: colors.primarySoft },
  sectionTabText: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: "600" },
  sectionTabTextActive: { color: colors.primary, fontWeight: "700" },
  activeDot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.primary },
  inactiveDot: { width: 7, height: 7, borderRadius: radius.pill },
  optionList: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    paddingStart: spacing.sm,
  },
  optionListContent: { gap: spacing.xs, paddingBottom: spacing.md },
  optionRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  optionIndicator: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xs,
  },
  optionIndicatorSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioIndicator: { borderRadius: radius.pill },
  radioDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  checkmark: { color: colors.primaryContrast, fontSize: 13, fontWeight: "800" },
  optionLabel: { flex: 1, color: colors.text, fontSize: 13 },
  optionCount: {
    minWidth: 24,
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
  },
  noOptions: { color: colors.muted, padding: spacing.md },
  drawerFooter: { flexDirection: "row", gap: spacing.sm },
  footerButton: { flex: 1 },
  applyButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },
  applyButtonText: { color: colors.primaryContrast, fontSize: 14, fontWeight: "700" },
  applyCountBadge: {
    minWidth: 24,
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryContrast,
  },
  applyCountText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});
