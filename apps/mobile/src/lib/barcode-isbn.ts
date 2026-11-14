export function normalizeBarcodeIsbn(value: string) {
  const isbn = value.replace(/[\s-]/g, "").toUpperCase();
  if (/^(?:978|979)\d{10}$/.test(isbn)) {
    const checksum = [...isbn].reduce(
      (total, digit, index) =>
        total + Number(digit) * (index % 2 === 0 ? 1 : 3),
      0,
    );
    return checksum % 10 === 0 ? isbn : null;
  }
  if (!/^\d{9}[\dX]$/.test(isbn)) return null;
  const checksum = [...isbn].reduce(
    (total, digit, index) =>
      total + (digit === "X" ? 10 : Number(digit)) * (10 - index),
    0,
  );
  return checksum % 11 === 0 ? isbn : null;
}
