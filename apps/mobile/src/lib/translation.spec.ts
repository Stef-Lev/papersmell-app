import { describe, expect, it } from "vitest";
import englishMessages from "../../../../src/messages/en.json";
import greekMessages from "../../../../src/messages/el.json";
import { translateMessage } from "./translation";

describe("mobile translations", () => {
  it("should resolve messages from the selected locale", () => {
    expect(translateMessage("mobile.auth.login", "en")).toBe(
      englishMessages.mobile.auth.login,
    );
    expect(translateMessage("mobile.auth.login", "el")).toBe(
      greekMessages.mobile.auth.login,
    );
  });

  it("should interpolate dynamic message values", () => {
    const name = "Niko";
    expect(
      translateMessage("mobile.home.greeting", "el", { name }),
    ).toBe(greekMessages.mobile.home.greeting.replace("{name}", name));
  });

  it("should report missing interpolation values", () => {
    expect(() => translateMessage("mobile.home.greeting", "en")).toThrow(
      'Missing value "name" for mobile translation: mobile.home.greeting',
    );
  });
});
