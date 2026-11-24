import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { LocalizedText as Text } from "./localized-text";
import { spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";
import type {
  MessageValues,
  MobileMessageKey,
} from "../lib/translation";

type Props = {
  subtitle?: string;
  subtitleKey?: MobileMessageKey;
  subtitleValues?: MessageValues;
  bottomNavigation?: boolean;
  children: ReactNode;
} & (
  | { title: string; titleKey?: never; titleValues?: never }
  | { title?: never; titleKey: MobileMessageKey; titleValues?: MessageValues }
);

export function Screen({
  title,
  titleKey,
  titleValues,
  subtitle,
  subtitleKey,
  subtitleValues,
  bottomNavigation = false,
  children,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          bottomNavigation && { paddingBottom: 88 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader />
        <View style={styles.heading}>
          {titleKey ? (
            <Text messageKey={titleKey} style={styles.title} values={titleValues} />
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
          {subtitleKey ? (
            <Text
              messageKey={subtitleKey}
              style={styles.subtitle}
              values={subtitleValues}
            />
          ) : subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg, paddingBottom: 36 },
  heading: { gap: spacing.xs, marginBottom: spacing.xs },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", lineHeight: 36 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
});
