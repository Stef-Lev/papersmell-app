export function isValidCurrentPage(value: unknown, pageCount?: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return false;
  }
  return (
    typeof pageCount !== "number" ||
    !Number.isFinite(pageCount) ||
    pageCount <= 0 ||
    value <= pageCount
  );
}
