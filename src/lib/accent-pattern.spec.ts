import { describe, expect, it } from "vitest";
import { toAccentInsensitivePattern } from "./accent-pattern";

function matches(query: string, text: string) {
  return new RegExp(toAccentInsensitivePattern(query), "i").test(text);
}

describe("toAccentInsensitivePattern", () => {
  it("should match Greek text regardless of accents and case", () => {
    expect(matches("οδυσσεια", "Η Οδύσσεια")).toBe(true);
    expect(matches("ΟΔΎΣΣΕΙΑ", "Οδύσσεια")).toBe(true);
    expect(matches("Οδύσσεια", "οδυσσεια")).toBe(true);
    expect(matches("υπνοβατες", "Οι υπνοβάτες")).toBe(true);
  });

  it("should treat the final sigma like a regular sigma", () => {
    expect(matches("κοσμος", "Κόσμος")).toBe(true);
    expect(matches("κοσμοσ", "Κόσμος")).toBe(true);
  });

  it("should match accented Latin text", () => {
    expect(matches("garcia marquez", "Gabriel García Márquez")).toBe(true);
  });

  it("should not match different text", () => {
    expect(matches("οδυσσεια", "Ιλιάδα")).toBe(false);
  });

  it("should treat regular expression characters literally", () => {
    expect(matches("c++ (2nd", "Learning C++ (2nd edition)")).toBe(true);
    expect(matches(".*", "anything")).toBe(false);
  });
});
