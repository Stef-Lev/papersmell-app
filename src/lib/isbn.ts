/** Strips an "ISBN" prefix, spaces and dashes; keeps digits and a trailing X. */
export function cleanIsbn(value: string) {
  return value
    .replace(/^ISBN(?:-1[03])?\s*:?\s*/i, "")
    .replace(/[\s\u2010-\u2015-]/g, "")
    .toUpperCase();
}

function isbn10CheckDigit(first9: string) {
  const sum = [...first9].reduce(
    (total, digit, index) => total + Number(digit) * (10 - index),
    0,
  );
  const check = (11 - (sum % 11)) % 11;
  return check === 10 ? "X" : String(check);
}

function isbn13CheckDigit(first12: string) {
  const sum = [...first12].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1),
    0,
  );
  return String((10 - (sum % 10)) % 10);
}

/** True when the text has the shape of an ISBN (or a scan with a price add-on), valid or not. */
export function looksLikeIsbn(value: string) {
  return /^(?:\d{9}[\dX]|\d{13}(?:\d{2}|\d{5})?)$/.test(cleanIsbn(value));
}

/**
 * The ISBN-13 for a valid ISBN-10 or ISBN-13 (dashes allowed), else null.
 * A 2- or 5-digit price/issue add-on after an ISBN-13 barcode scan is ignored.
 */
export function toIsbn13(value: string) {
  let isbn = cleanIsbn(value);
  if (/^\d{15}$|^\d{18}$/.test(isbn)) isbn = isbn.slice(0, 13);
  if (/^\d{13}$/.test(isbn)) {
    return isbn13CheckDigit(isbn.slice(0, 12)) === isbn[12] ? isbn : null;
  }
  if (/^\d{9}[\dX]$/.test(isbn)) {
    if (isbn10CheckDigit(isbn.slice(0, 9)) !== isbn[9]) return null;
    const first12 = `978${isbn.slice(0, 9)}`;
    return first12 + isbn13CheckDigit(first12);
  }
  return null;
}

/** The ISBN-10 equivalent of an ISBN-13 that starts with 978, else null. */
export function toIsbn10(isbn13: string) {
  if (!/^978\d{10}$/.test(isbn13)) return null;
  const first9 = isbn13.slice(3, 12);
  return first9 + isbn10CheckDigit(first9);
}

// Registration groups 960 and 618 are Greece.
const GREEK_ISBN_PREFIXES = ["978960", "978618"];

/** The ISBN-13 when the value is a valid Greek ISBN, else null. */
export function toGreekIsbn13(value: string) {
  const isbn = toIsbn13(value);
  return isbn && GREEK_ISBN_PREFIXES.some((prefix) => isbn.startsWith(prefix))
    ? isbn
    : null;
}
