import { useMemo } from "react";
import { usePreferences, type ThemeColors } from "../providers/preferences-provider";

export function useThemedStyles<T>(
  createStyles: (colors: ThemeColors) => T,
) {
  const { colors } = usePreferences();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
