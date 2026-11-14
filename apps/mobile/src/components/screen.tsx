import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { LocalizedText as Text } from "./localized-text";
import { spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader />
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
