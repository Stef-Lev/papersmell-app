import { Text as NativeText, type TextProps } from "react-native";
import type { ReactNode } from "react";
import {
  translateMessage,
  type MessageValues,
  type MobileMessageKey,
} from "../lib/translation";
import { usePreferences } from "../providers/preferences-provider";

export function LocalizedText({
  children,
  accessibilityLabel,
  accessibilityLabelKey,
  accessibilityValues,
  messageKey,
  values,
  ...props
}: TextProps & {
  children?: ReactNode;
  messageKey?: MobileMessageKey;
  values?: MessageValues;
  accessibilityLabelKey?: MobileMessageKey;
  accessibilityValues?: MessageValues;
}) {
  const { locale } = usePreferences();
  const localizedChildren = messageKey
    ? translateMessage(messageKey, locale, values)
    : children;
  return (
    <NativeText
      {...props}
      accessibilityLabel={
        accessibilityLabelKey
          ? translateMessage(accessibilityLabelKey, locale, accessibilityValues)
          : accessibilityLabel
      }
    >
      {localizedChildren}
    </NativeText>
  );
}
