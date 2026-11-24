import { StyleSheet, Text, View } from "react-native";
import { LocalizedText } from "./localized-text";
import { BrandMark } from "./brand-mark";
import { useAuth } from "../providers/auth-provider";
import { spacing } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function AppHeader() {
  const { session } = useAuth();
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
});
