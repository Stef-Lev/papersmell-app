// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import {
  createMobileAccessToken,
  readMobileAccessToken,
} from "@/lib/mobile-token";

const originalSecret = process.env.AUTH_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalSecret;
  }
});

describe("mobile access tokens", () => {
  it("should issue a token that identifies its user", async () => {
    process.env.AUTH_SECRET = "a-long-test-secret-that-is-at-least-thirty-two-characters";
    const token = await createMobileAccessToken({
      id: "000000000000000000000001",
      name: "Reader",
      email: "reader@example.com",
    });

    await expect(readMobileAccessToken(token)).resolves.toEqual({
      id: "000000000000000000000001",
    });
  });

  it("should reject a token with a modified signature", async () => {
    process.env.AUTH_SECRET = "a-long-test-secret-that-is-at-least-thirty-two-characters";
    const token = await createMobileAccessToken({
      id: "000000000000000000000001",
      name: "Reader",
      email: "reader@example.com",
    });
    const modifiedToken = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    await expect(readMobileAccessToken(modifiedToken)).rejects.toThrow();
  });
});
