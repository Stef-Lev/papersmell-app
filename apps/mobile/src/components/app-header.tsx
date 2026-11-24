import { Pressable, StyleSheet, Text, View } from "react-native";
import { LocalizedText } from "./localized-text";
import { BrandMark } from "./brand-mark";
import { useAuth } from "../providers/auth-provider";
import { radius, spacing } from "../lib/theme";
import { usePreferences } from "../providers/preferences-provider";
import { translateMessage } from "../lib/translation";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function AppHeader() {
  const { session, signOut } = useAuth();
  const { locale } = usePreferences();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <BrandMark />
        <View>
          <LocalizedText style={styles.brandName}>PaperSmell</LocalizedText>
          {session?.user.name ? (
            <Text numberOfLines={1} style={styles.userName}>
              {session.user.name}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityLabel={translateMessage("mobile.common.signOut", locale)}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => void signOut()}
        style={styles.signOut}
      >
        <LocalizedText style={styles.signOutText}>↗</LocalizedText>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  brandName: { color: colors.text, fontSize: 17, fontWeight: "800" },
  userName: { maxWidth: 200, marginTop: 2, color: colors.muted, fontSize: 12 },
  signOut: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  signOutText: { color: colors.primary, fontSize: 20, fontWeight: "700" },
});
