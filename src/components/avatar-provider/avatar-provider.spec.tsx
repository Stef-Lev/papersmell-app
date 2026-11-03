import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { renderWithIntl } from "@/test/utils";
import { AvatarProvider, useAvatar } from "./avatar-provider";

function AvatarControls() {
  const { refreshAvatar, clearAvatar } = useAvatar();
  return (
    <>
      <button type="button" onClick={() => refreshAvatar("updated-version")}>
        Refresh avatar
      </button>
      <button type="button" onClick={clearAvatar}>
        Clear avatar
      </button>
    </>
  );
}

function renderWithProvider(initialAvatarUrl: string | null = null) {
  return renderWithIntl(
    <AvatarProvider initialAvatarUrl={initialAvatarUrl}>
      <UserAvatar userName="Jane Doe" />
      <AvatarControls />
    </AvatarProvider>,
  );
}

describe("AvatarProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should show initials when no initial avatar URL is provided", () => {
    renderWithProvider();

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should render the server-provided avatar URL without fetching again", () => {
    const fetchAvatar = vi.fn();
    vi.stubGlobal("fetch", fetchAvatar);
    renderWithProvider("/api/profile/avatar?v=initial-version");

    expect(screen.getByRole("img", { name: "Jane Doe" })).toHaveAttribute(
      "src",
      "/api/profile/avatar?v=initial-version",
    );
    expect(screen.queryByText("JD")).not.toBeInTheDocument();
    expect(fetchAvatar).not.toHaveBeenCalled();
  });

  it("should show the new avatar version after a profile update", async () => {
    const user = userEvent.setup();
    renderWithProvider("/api/profile/avatar?v=initial-version");

    await user.click(screen.getByRole("button", { name: "Refresh avatar" }));

    expect(screen.getByRole("img", { name: "Jane Doe" })).toHaveAttribute(
      "src",
      "/api/profile/avatar?v=updated-version",
    );
  });

  it("should show initials after the avatar is removed", async () => {
    const user = userEvent.setup();
    renderWithProvider("/api/profile/avatar?v=initial-version");

    await user.click(screen.getByRole("button", { name: "Clear avatar" }));

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should throw when useAvatar is used outside the provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => renderWithIntl(<AvatarControls />)).toThrow(
      "useAvatar must be used within AvatarProvider",
    );
    consoleError.mockRestore();
  });
});
