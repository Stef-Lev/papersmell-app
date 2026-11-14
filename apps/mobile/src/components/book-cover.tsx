import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { LocalizedText as Text } from "./localized-text";
import { radius } from "../lib/theme";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";

export function BookCover({
  url,
  title,
  compact = false,
}: {
  url?: string;
  title: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const styles = useThemedStyles(createStyles);
  const size = compact ? styles.compact : styles.regular;
  if (!url || failed) {
    return (
      <View style={[styles.cover, size, styles.placeholder]}>
        <Text style={styles.placeholderMark}>P</Text>
      </View>
    );
  }
  return (
    <Image
      alt={title}
      accessibilityLabel={`${title} cover`}
      onError={() => setFailed(true)}
      resizeMode="cover"
      source={{ uri: url }}
      style={[styles.cover, size]}
    />
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  cover: { borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  regular: { width: 68, height: 100 },
  compact: { width: 52, height: 76 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderMark: { color: colors.primary, fontSize: 22, fontWeight: "800" },
});
