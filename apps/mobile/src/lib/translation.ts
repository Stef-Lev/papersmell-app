import englishMessages from "../../../../src/messages/en.json";
import greekMessages from "../../../../src/messages/el.json";
import type { Locale } from "../providers/preferences-provider";
import type { Shelf } from "./types";

type MessageKey<T> = T extends object
  ? {
      [Key in keyof T & string]: T[Key] extends string
        ? Key
        : `${Key}.${MessageKey<T[Key]>}`;
    }[keyof T & string]
  : never;

export type MobileMessageKey = `mobile.${MessageKey<typeof englishMessages.mobile>}`;
export type MessageValues = Record<string, string | number>;

const shelfMessageKeys: Record<Shelf, MobileMessageKey> = {
  "to-read": "mobile.common.shelves.toRead",
  "currently-reading": "mobile.common.shelves.currentlyReading",
  read: "mobile.common.shelves.read",
  "did-not-finish": "mobile.common.shelves.didNotFinish",
};

export function getShelfMessageKey(shelf: Shelf) {
  return shelfMessageKeys[shelf];
}

export class MobileMessageError extends Error {
  constructor(
    readonly messageKey: MobileMessageKey,
    readonly values?: MessageValues,
  ) {
    super(messageKey);
    this.name = "MobileMessageError";
  }
}

function getMessage(dictionary: unknown, key: MobileMessageKey) {
  let value: unknown = dictionary;
  for (const part of key.split(".").slice(1)) {
    if (!value || typeof value !== "object" || !(part in value)) {
      throw new Error(`Missing mobile translation: ${key}`);
    }
    value = (value as Record<string, unknown>)[part];
  }
  if (typeof value !== "string") {
    throw new Error(`Mobile translation is not a string: ${key}`);
  }
  return value;
}

export function translateMessage(
  key: MobileMessageKey,
  locale: Locale,
  values?: MessageValues,
) {
  const dictionary =
    locale === "el" ? greekMessages.mobile : englishMessages.mobile;
  return getMessage(dictionary, key).replace(/\{([^}]+)\}/g, (placeholder, name: string) => {
    if (!values || !(name in values)) {
      throw new Error(`Missing value "${name}" for mobile translation: ${key}`);
    }
    return String(values[name]);
  });
}

export function getErrorMessage(
  cause: unknown,
  locale: Locale,
  fallbackKey: MobileMessageKey,
) {
  if (cause instanceof MobileMessageError) {
    return translateMessage(cause.messageKey, locale, cause.values);
  }
  if (cause instanceof Error) return cause.message;
  return translateMessage(fallbackKey, locale);
}
