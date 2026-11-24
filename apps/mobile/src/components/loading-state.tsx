import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { BrandMark } from "./brand-mark";
import { usePreferences } from "../providers/preferences-provider";
import { useThemedStyles } from "../lib/use-themed-styles";
import type { ThemeColors } from "../lib/theme";
import {
  translateMessage,
  type MobileMessageKey,
} from "../lib/translation";

export function LoadingState({
  label = "mobile.common.loadingBooks",
}: {
  label?: MobileMessageKey;
}) {
  const { locale } = usePreferences();
  const styles = useThemedStyles(createStyles);
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.05],
  });

  return (
    <View
      accessibilityLabel={translateMessage(label, locale)}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logo,
          { opacity, transform: [{ scale }] },
        ]}
      >
        <BrandMark size={96} />
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  logo: { width: 96, height: 96 },
});
