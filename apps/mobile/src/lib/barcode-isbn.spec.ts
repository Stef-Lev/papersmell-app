import { describe, expect, it } from "vitest";
import { normalizeBarcodeIsbn } from "./barcode-isbn";

describe("normalizeBarcodeIsbn", () => {
  it("should normalize a valid ISBN-13 barcode", () => {
    expect(normalizeBarcodeIsbn("978-0-306-40615-7")).toBe("9780306406157");
  });

  it("should reject a barcode with an invalid check digit", () => {
    expect(normalizeBarcodeIsbn("9780306406158")).toBeNull();
  });

  it("should reject valid-looking EAN codes that are not ISBNs", () => {
    expect(normalizeBarcodeIsbn("4006381333931")).toBeNull();
  });

  it("should accept a valid ISBN-10 with an X check digit", () => {
    expect(normalizeBarcodeIsbn("080442957X")).toBe("080442957X");
  });
});
