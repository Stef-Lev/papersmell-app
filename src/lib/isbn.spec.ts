import { describe, expect, it } from "vitest";
import { toGreekIsbn13, toIsbn13 } from "./isbn";

describe("isbn", () => {
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
