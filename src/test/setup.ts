import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { resetNavigation } from "./navigation";

// Browser APIs jsdom lacks that Radix Select and Ark UI popovers rely on.
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("next/navigation", async () => {
  const nav = await import("./navigation");
  return {
    useRouter: () => nav.testRouter,
    usePathname: () => nav.getPathname(),
    useSearchParams: () => nav.getSearchParams(),
    useParams: () => ({}),
    redirect: (url: string) => {
      throw new nav.RedirectError(url);
    },
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  };
});

vi.mock("next-intl/server", async () => {
  const { createTranslator, createFormatter } = await import("next-intl");
  const { DEFAULT_LOCALE } = await import("@/i18n/config");
  const messages = (await import("@/messages/en.json")).default;
  return {
    getLocale: async () => DEFAULT_LOCALE,
    getMessages: async () => messages,
    getFormatter: async () => createFormatter({ locale: DEFAULT_LOCALE }),
    getTranslations: async (
      options?: string | { namespace?: string; locale?: string },
    ) => {
      const namespace =
        typeof options === "string" ? options : options?.namespace;
      return createTranslator({
        locale: DEFAULT_LOCALE,
        messages,
        namespace: namespace as never,
      });
    },
  };
});

afterEach(() => {
  cleanup();
  resetNavigation();
});
