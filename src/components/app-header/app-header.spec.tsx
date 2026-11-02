import { screen, within } from "@testing-library/react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { AvatarProvider } from "@/components/avatar-provider/avatar-provider";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { Theme } from "@/lib/preferences";
import { renderWithIntl, t } from "@/test/utils";
import AppHeader from "./app-header";

// next-auth needs a real auth backend (and MongoDB), which jsdom can't provide.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));

function signIn(user: Session["user"] | null) {
  const session = user ? { user, expires: "2099-01-01" } : null;
  vi.mocked(auth as unknown as () => Promise<Session | null>).mockResolvedValue(
    session,
  );
  vi.mocked(useSession).mockReturnValue(
    (session
      ? { data: session, status: "authenticated" }
      : { data: null, status: "unauthenticated" }) as ReturnType<
      typeof useSession
    >,
  );
}

async function renderHeader(theme = Theme.Light) {
  const header = await AppHeader({ theme });
  return renderWithIntl(
    <ToastProvider>
      <AvatarProvider>{header}</AvatarProvider>
    </ToastProvider>,
  );
}

describe("AppHeader", () => {
  beforeEach(() => {
    // jsdom lacks matchMedia (used for the system theme and desktop breakpoint).
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    // No custom avatar uploaded: the avatar API responds 404.
    vi.stubGlobal("fetch", async () => new Response(null, { status: 404 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should link the logo to the home page", async () => {
    signIn(null);
    await renderHeader();

    expect(screen.getByRole("link", { name: "PaperSmell" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("should render the main navigation links", async () => {
    signIn(null);
    await renderHeader();

    const banner = screen.getByRole("banner");
    expect(
      within(banner).getByRole("link", { name: t("nav.library") }),
    ).toHaveAttribute("href", "/library");
    expect(
      within(banner).getByRole("link", { name: t("nav.searchLabel") }),
    ).toHaveAttribute("href", "/search");
    expect(
      within(banner).getByRole("link", { name: t("nav.analytics") }),
    ).toHaveAttribute("href", "/analytics");
  });

  it("should show the signed in user's initials linking to the profile", async () => {
    signIn({ id: "user-1", name: "Jane Doe", email: "jane@example.com" });
    await renderHeader();

    expect(await screen.findByRole("link", { name: "JD" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("should show a fallback avatar when nobody is signed in", async () => {
    signIn(null);
    await renderHeader();

    expect(screen.getByRole("link", { name: "U" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("should render the preferences controls for the given theme", async () => {
    signIn(null);
    await renderHeader(Theme.Dark);

    expect(
      screen.getByRole("button", { name: t("preferences.darkMode") }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
