import { screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvatarProvider } from "@/components/avatar-provider/avatar-provider";
import { renderWithIntl, t } from "@/test/utils";
import BottomNavigation from "./bottom-navigation";

const navigation = vi.hoisted(() => ({ pathname: "/library" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));
vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));

function renderNavigation() {
  return renderWithIntl(
    <AvatarProvider>
      <BottomNavigation userName="Jane Doe" />
    </AvatarProvider>,
  );
}

describe("BottomNavigation", () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as ReturnType<typeof useSession>);
    vi.stubGlobal("fetch", async () => new Response(null, { status: 404 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should link to every main page and the profile", () => {
    renderNavigation();

    expect(screen.getByRole("link", { name: t("nav.home") })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: t("nav.library") })).toHaveAttribute(
      "href",
      "/library",
    );
    expect(
      screen.getByRole("link", { name: t("nav.searchLabel") }),
    ).toHaveAttribute("href", "/search");
    expect(
      screen.getByRole("link", { name: t("nav.analytics") }),
    ).toHaveAttribute("href", "/analytics");
    expect(screen.getByRole("link", { name: "JD" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("should mark only the current page as active", () => {
    renderNavigation();

    expect(screen.getByRole("link", { name: t("nav.library") })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: t("nav.home") })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
