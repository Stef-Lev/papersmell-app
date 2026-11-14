import { Text as NativeText, type TextProps } from "react-native";
import type { ReactNode } from "react";
import { translateText } from "../lib/translation";
import { usePreferences } from "../providers/preferences-provider";

export function LocalizedText({
  children,
  accessibilityLabel,
  ...props
}: TextProps & { children?: ReactNode }) {
  const { locale } = usePreferences();
  const localizedChildren =
    typeof children === "string" ? translateText(children, locale) : children;
  return (
    <NativeText
      {...props}
      accessibilityLabel={
        accessibilityLabel
          ? translateText(accessibilityLabel, locale)
          : undefined
      }
    >
      {localizedChildren}
    </NativeText>
  );
}
