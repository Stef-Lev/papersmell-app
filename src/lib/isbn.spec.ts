import { describe, expect, it } from "vitest";
import { looksLikeIsbn, toGreekIsbn13, toIsbn10, toIsbn13 } from "./isbn";

describe("isbn", () => {
  it("should ignore a 5-digit or 2-digit barcode add-on", () => {
    expect(toIsbn13("978960211652451995")).toBe("9789602116524");
    expect(toIsbn13("978960211652412")).toBe("9789602116524");
    expect(toIsbn13("978960211652551995")).toBeNull();
  });

  it("should tell ISBN-shaped text apart from a title or author search", () => {
    expect(looksLikeIsbn("9789602116525")).toBe(true);
    expect(looksLikeIsbn("0-306-40615-2")).toBe(true);
    expect(looksLikeIsbn("1984")).toBe(false);
    expect(looksLikeIsbn("Μικρός Πρίγκιπας")).toBe(false);
  });

  it("should convert an ISBN-13 to its ISBN-10", () => {
    expect(toIsbn10("9780306406157")).toBe("0306406152");
    expect(toIsbn10("9791034345588")).toBeNull();
  });

  it("should convert a valid ISBN-10 to ISBN-13", () => {
    expect(toIsbn13("0-306-40615-2")).toBe("9780306406157");
  });

  it("should accept an ISBN-13 with dashes and an ISBN prefix", () => {
    expect(toIsbn13("ISBN 978-960-211-652-4")).toBe("9789602116524");
  });

  it("should reject an ISBN with a wrong check digit", () => {
    expect(toIsbn13("9789602116525")).toBeNull();
  });

  it("should recognise Greek ISBNs", () => {
    expect(toGreekIsbn13("978-960-211-652-4")).toBe("9789602116524");
    expect(toGreekIsbn13("9786185376055")).toBe("9786185376055");
    expect(toGreekIsbn13("9780306406157")).toBeNull();
  });
});
