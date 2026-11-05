// Each base letter maps to the accented forms that should match it. Case is
// handled by the "i" flag; the final sigma is treated as the same letter as σ.
const ACCENT_CLASSES: Record<string, string> = {
  α: "αά",
  ε: "εέ",
  η: "ηή",
  ι: "ιίϊΐ",
  ο: "οό",
  υ: "υύϋΰ",
  ω: "ωώ",
  σ: "σς",
  ς: "σς",
  a: "aàáâãäå",
  e: "eèéêë",
  i: "iìíîï",
  o: "oòóôõö",
  u: "uùúûü",
  c: "cç",
  n: "nñ",
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
}

export function normalizeAccentInsensitiveText(value: string) {
  return stripAccents(value.toLowerCase()).replace(/ς/g, "σ");
}

/**
 * A case- and accent-insensitive "contains" regex source, so a search for
 * "οδυσσεια" finds "Οδύσσεια". Greek and common Latin accents are covered.
 */
export function toAccentInsensitivePattern(text: string) {
  return [...normalizeAccentInsensitiveText(text.trim())]
    .map((char) => {
      const accented = ACCENT_CLASSES[char];
      return accented ? `[${accented}]` : escapeRegExp(char);
    })
    .join("");
}
