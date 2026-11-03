import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AvatarProvider } from "@/components/avatar-provider/avatar-provider";
import { renderWithIntl } from "@/test/utils";
import UserAvatar from "./user-avatar";
import type { UserAvatarProps } from "./user-avatar.types";

function renderAvatar(
  props: UserAvatarProps = {},
  initialAvatarUrl: string | null = null,
) {
  return renderWithIntl(
    <AvatarProvider initialAvatarUrl={initialAvatarUrl}>
      <UserAvatar {...props} />
    </AvatarProvider>,
  );
}

function MenuHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <UserAvatar as="button" userName="Jane Doe" onClick={() => setOpen((o) => !o)} />
      {open && <p>Account menu</p>}
    </>
  );
}

describe("UserAvatar", () => {
  describe("without an uploaded avatar", () => {
    it("should link to the profile page with the user's initials", () => {
      renderAvatar({ userName: "Jane Doe" });

      const link = screen.getByRole("link", { name: "JD" });
      expect(link).toHaveAttribute("href", "/profile");
      expect(screen.getByTitle("Jane Doe")).toHaveClass("avatar", "medium");
    });

    it("should use at most two initials", () => {
      renderAvatar({ userName: "ursula kroeber le guin" });

      expect(screen.getByRole("link", { name: "UK" })).toBeInTheDocument();
    });

    it("should fall back to the email when there is no name", () => {
      renderAvatar({ userName: null, userEmail: "reader@example.com" });

      expect(screen.getByRole("link", { name: "R" })).toBeInTheDocument();
      expect(screen.getByTitle("reader@example.com")).toBeInTheDocument();
    });

    it("should show a generic placeholder without a name or email", () => {
      renderAvatar();

      expect(screen.getByRole("link", { name: "U" })).toBeInTheDocument();
      expect(screen.getByTitle("User")).toBeInTheDocument();
    });

    it("should use a custom href and size", () => {
      renderAvatar({ userName: "Jane Doe", href: "/settings", size: "large" });

      expect(screen.getByRole("link", { name: "JD" })).toHaveAttribute("href", "/settings");
      expect(screen.getByTitle("Jane Doe")).toHaveClass("large");
    });

    it("should render extra children inside the avatar", () => {
      renderAvatar({ userName: "Jane Doe", children: <span>3 new</span> });

      expect(screen.getByTitle("Jane Doe")).toHaveTextContent("3 new");
    });

    it("should render as a button that runs the click handler", async () => {
      const user = userEvent.setup();
      renderWithIntl(
        <AvatarProvider>
          <MenuHarness />
        </AvatarProvider>,
      );

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "JD" }));

      expect(screen.getByText("Account menu")).toBeInTheDocument();
    });
  });

  describe("with an uploaded avatar", () => {
    it("should show the seeded avatar image instead of the initials", () => {
      renderAvatar(
        { userName: "Jane Doe" },
        "/api/profile/avatar?v=initial-version",
      );

      expect(screen.getByRole("img", { name: "Jane Doe" })).toHaveAttribute(
        "src",
        "/api/profile/avatar?v=initial-version",
      );
      expect(screen.getByRole("link", { name: "Jane Doe" })).not.toHaveTextContent("JD");
    });

    it("should use a generic alt text without a name or email", () => {
      renderAvatar({}, "/api/profile/avatar?v=initial-version");

      expect(screen.getByRole("img", { name: "User avatar" })).toBeInTheDocument();
    });
  });
});
