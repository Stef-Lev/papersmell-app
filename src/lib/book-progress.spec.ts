import { describe, expect, it } from "vitest";
import { isValidCurrentPage } from "@/lib/book-progress";

describe("book progress validation", () => {
  it("should accept whole-number pages within a known book length", () => {
    expect(isValidCurrentPage(0, 250)).toBe(true);
    expect(isValidCurrentPage(250, 250)).toBe(true);
    expect(isValidCurrentPage(251, 250)).toBe(false);
  });

  it("should reject negative and fractional pages even when length is unknown", () => {
    expect(isValidCurrentPage(-1)).toBe(false);
    expect(isValidCurrentPage(1.5)).toBe(false);
    expect(isValidCurrentPage(12, 0)).toBe(true);
  });
});
