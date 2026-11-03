import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarProvider } from "@/components/avatar-provider/avatar-provider";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import ProfilePage from "./profile-page";

const auth = vi.hoisted(() => ({
  update: vi.fn(async () => null),
  signOut: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "user-1", name: "Ada", email: "ada@example.com" } },
    update: auth.update,
  }),
  signOut: auth.signOut,
}));

type Profile = { id: string; name: string; email: string; hasAvatar: boolean };

const PASSWORD = "correct-horse";

// In-memory stand-in for the /api/profile endpoints.
function createFakeApi(initial: Partial<Profile> = {}) {
  const state = {
    profile: {
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      hasAvatar: false,
      ...initial,
    } as Profile,
    password: PASSWORD,
    failProfileLoad: false,
    failAvatar: false,
    networkDown: false,
  };

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  async function fetch(input: RequestInfo | URL, init: RequestInit = {}) {
    if (state.networkDown) throw new TypeError("Failed to fetch");
    const url = String(input);
    const method = init.method ?? "GET";

    if (url === "/api/profile" && method === "GET") {
      return state.failProfileLoad
        ? json({ error: "Unauthorized" }, 401)
        : json(state.profile);
    }
    if (url === "/api/profile" && method === "PUT") {
      const body = JSON.parse(String(init.body));
      if (body.currentPassword !== undefined) {
        if (body.currentPassword !== state.password) {
          return json({ error: "Current password is incorrect" }, 400);
        }
        state.password = body.newPassword;
        return json(state.profile);
      }
      if (body.name === "taken") return json({}, 500);
      state.profile = { ...state.profile, name: body.name };
      return json(state.profile);
    }
    if (url.startsWith("/api/profile/avatar")) {
      if (method === "GET") {
        return state.profile.hasAvatar
          ? new Response(new Blob(["png"], { type: "image/png" }))
          : json({ error: "Avatar not found" }, 404);
      }
      if (state.failAvatar) return json({ error: "Storage unavailable" }, 500);
      state.profile.hasAvatar = method === "POST";
      return json({ ok: true, avatarVersion: "updated-version" });
    }
    return json({ error: "Not found" }, 404);
  }

  return { state, fetch };
}

let api: ReturnType<typeof createFakeApi>;

function setup(initial?: Partial<Profile>) {
  api = createFakeApi(initial);
  vi.stubGlobal("fetch", api.fetch);
}

async function renderProfile() {
  renderWithIntl(
    <ToastProvider>
      <AvatarProvider
        initialAvatarUrl={
          api.state.profile.hasAvatar
            ? "/api/profile/avatar?v=initial-version"
            : null
        }
      >
        <ProfilePage />
      </AvatarProvider>
    </ToastProvider>,
  );
  return screen.findByRole("heading", {
    level: 1,
    name: t("pages.profile.title"),
  });
}

function getFileInput() {
  // The file picker is a visually hidden input without an accessible name.
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

beforeEach(() => {
  setup();
  vi.stubGlobal("confirm", () => true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  auth.update.mockClear();
  auth.signOut.mockClear();
});

describe("ProfilePage", () => {
  it("should show a loading indicator while the profile is fetched", async () => {
    renderWithIntl(
      <ToastProvider>
        <AvatarProvider>
          <ProfilePage />
        </AvatarProvider>
      </ToastProvider>,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("should show an error when the profile cannot be loaded", async () => {
    api.state.failProfileLoad = true;

    renderWithIntl(
      <ToastProvider>
        <AvatarProvider>
          <ProfilePage />
        </AvatarProvider>
      </ToastProvider>,
    );

    expect(
      await screen.findByText(t("pages.profile.errorLoadingProfile")),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("should show an error when the network request fails", async () => {
    api.state.networkDown = true;

    renderWithIntl(
      <ToastProvider>
        <AvatarProvider>
          <ProfilePage />
        </AvatarProvider>
      </ToastProvider>,
    );

    expect(
      await screen.findByText(t("pages.profile.errorLoadingProfile")),
    ).toBeInTheDocument();
  });

  it("should render every section with the loaded profile details", async () => {
    await renderProfile();

    for (const section of [
      "avatarSection",
      "profileSection",
      "passwordSection",
      "logoutSection",
    ] as const) {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: t(`pages.profile.${section}`),
        }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("textbox", { name: t("pages.profile.name") }),
    ).toHaveValue("Ada Lovelace");
    const email = screen.getByRole("textbox", {
      name: t("pages.profile.email"),
    });
    expect(email).toHaveValue("ada@example.com");
    expect(email).toBeDisabled();
    expect(
      screen.getByText(t("pages.profile.emailCannotChange")),
    ).toBeInTheDocument();
  });

  describe("avatar", () => {
    it("should show the name initial and no remove button without an avatar", async () => {
      await renderProfile();

      expect(screen.getByText("A")).toBeInTheDocument();
      expect(
        screen.queryByRole("img", { name: "Ada Lovelace" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: t("pages.profile.removeAvatar") }),
      ).not.toBeInTheDocument();
    });

    it("should show the stored avatar image when the user has one", async () => {
      setup({ hasAvatar: true });

      await renderProfile();

      expect(
        await screen.findByRole("img", { name: "Ada Lovelace" }),
      ).toHaveAttribute("src", "/api/profile/avatar?v=initial-version");
      expect(
        screen.getByRole("button", { name: t("pages.profile.removeAvatar") }),
      ).toBeInTheDocument();
    });

    it("should upload a new avatar and show its preview", async () => {
      const user = userEvent.setup();
      await renderProfile();

      await user.upload(
        getFileInput(),
        new File(["png"], "me.png", { type: "image/png" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.successAvatarUploaded"),
      );
      expect(
        screen.getByRole("img", { name: "Ada Lovelace" }),
      ).toHaveAttribute("src", "/api/profile/avatar?v=updated-version");
      expect(screen.queryByText("A")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: t("pages.profile.removeAvatar") }),
      ).toBeInTheDocument();
    });

    it("should reject files that are not images", async () => {
      const user = userEvent.setup({ applyAccept: false });
      await renderProfile();

      await user.upload(
        getFileInput(),
        new File(["%PDF"], "cv.pdf", { type: "application/pdf" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.errorInvalidImageType"),
      );
      expect(screen.queryByRole("img", { name: "Ada Lovelace" })).toBeNull();
    });

    it("should reject images larger than 5MB", async () => {
      const user = userEvent.setup();
      await renderProfile();

      await user.upload(
        getFileInput(),
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {
          type: "image/png",
        }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.errorFileTooLarge"),
      );
    });

    it("should show the server error when the upload fails", async () => {
      const user = userEvent.setup();
      api.state.failAvatar = true;
      await renderProfile();

      await user.upload(
        getFileInput(),
        new File(["png"], "me.png", { type: "image/png" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Storage unavailable",
      );
      expect(screen.queryByRole("img", { name: "Ada Lovelace" })).toBeNull();
    });

    it("should remove the avatar after confirmation", async () => {
      const user = userEvent.setup();
      setup({ hasAvatar: true });
      await renderProfile();

      await user.click(
        screen.getByRole("button", { name: t("pages.profile.removeAvatar") }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.successAvatarRemoved"),
      );
      expect(screen.queryByRole("img", { name: "Ada Lovelace" })).toBeNull();
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: t("pages.profile.removeAvatar") }),
      ).not.toBeInTheDocument();
    });

    it("should keep the avatar when removal is not confirmed", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("confirm", () => false);
      setup({ hasAvatar: true });
      await renderProfile();

      await user.click(
        screen.getByRole("button", { name: t("pages.profile.removeAvatar") }),
      );

      expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("should show an error when removing the avatar fails", async () => {
      const user = userEvent.setup();
      setup({ hasAvatar: true });
      api.state.failAvatar = true;
      await renderProfile();

      await user.click(
        screen.getByRole("button", { name: t("pages.profile.removeAvatar") }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.errorRemovingAvatar"),
      );
      expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
    });
  });

  describe("account information", () => {
    it("should save the trimmed name and update the session", async () => {
      const user = userEvent.setup();
      await renderProfile();
      const name = screen.getByRole("textbox", { name: t("pages.profile.name") });

      await user.clear(name);
      await user.type(name, "  Ada King  ");
      await user.click(
        screen.getByRole("button", { name: t("pages.profile.saveChanges") }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.successProfileUpdated"),
      );
      expect(api.state.profile.name).toBe("Ada King");
      expect(auth.update).toHaveBeenCalledWith({
        user: { id: "user-1", name: "Ada King", email: "ada@example.com" },
      });
    });

    it("should require a non-blank name", async () => {
      const user = userEvent.setup();
      await renderProfile();
      const name = screen.getByRole("textbox", { name: t("pages.profile.name") });

      await user.clear(name);
      await user.type(name, "   ");
      await user.click(
        screen.getByRole("button", { name: t("pages.profile.saveChanges") }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.errorNameRequired"),
      );
      expect(api.state.profile.name).toBe("Ada Lovelace");
    });

    it("should show a fallback error when saving fails without a message", async () => {
      const user = userEvent.setup();
      await renderProfile();
      const name = screen.getByRole("textbox", { name: t("pages.profile.name") });

      await user.clear(name);
      await user.type(name, "taken");
      await user.click(
        screen.getByRole("button", { name: t("pages.profile.saveChanges") }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.errorUpdatingProfile"),
      );
    });

    it("should show a saving label and disable the form while saving", async () => {
      const user = userEvent.setup();
      let release!: () => void;
      const pending = new Promise<void>((resolve) => (release = resolve));
      const realFetch = api.fetch;
      vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "PUT") await pending;
        return realFetch(input, init);
      });
      await renderProfile();

      await user.click(
        screen.getByRole("button", { name: t("pages.profile.saveChanges") }),
      );

      expect(
        screen.getByRole("button", { name: t("pages.profile.saving") }),
      ).toBeDisabled();
      expect(
        screen.getByRole("textbox", { name: t("pages.profile.name") }),
      ).toBeDisabled();

      release();
      expect(
        await screen.findByRole("button", {
          name: t("pages.profile.saveChanges"),
        }),
      ).toBeEnabled();
    });
  });

  describe("password", () => {
    async function openPasswordForm() {
      const user = userEvent.setup();
      await renderProfile();
      await user.click(
        screen.getByRole("button", { name: t("pages.profile.changePassword") }),
      );
      return user;
    }

    async function fillPasswordForm(
      user: ReturnType<typeof userEvent.setup>,
      current: string,
      next: string,
      confirm: string,
    ) {
      await user.type(
        screen.getByLabelText(t("pages.profile.currentPassword")),
        current,
      );
      await user.type(screen.getByLabelText(t("pages.profile.newPassword")), next);
      await user.type(
        screen.getByLabelText(t("pages.profile.confirmPassword")),
        confirm,
      );
      await user.click(
        screen.getByRole("button", { name: t("pages.profile.changePassword") }),
      );
    }

    it("should open the password form with masked fields", async () => {
      await openPasswordForm();

      for (const key of [
        "currentPassword",
        "newPassword",
        "confirmPassword",
      ] as const) {
        expect(screen.getByLabelText(t(`pages.profile.${key}`))).toHaveAttribute(
          "type",
          "password",
        );
      }
    });

    it("should clear and close the form on cancel", async () => {
      const user = await openPasswordForm();
      await user.type(
        screen.getByLabelText(t("pages.profile.currentPassword")),
        "secret",
      );

      await user.click(
        screen.getByRole("button", { name: t("pages.profile.cancel") }),
      );
      expect(
        screen.queryByLabelText(t("pages.profile.currentPassword")),
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: t("pages.profile.changePassword") }),
      );
      expect(
        screen.getByLabelText(t("pages.profile.currentPassword")),
      ).toHaveValue("");
    });

    it("should reject a new password shorter than 8 characters", async () => {
      const user = await openPasswordForm();

      await fillPasswordForm(user, PASSWORD, "short", "short");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.errorPasswordTooShort"),
      );
      expect(api.state.password).toBe(PASSWORD);
    });

    it("should reject a confirmation that does not match", async () => {
      const user = await openPasswordForm();

      await fillPasswordForm(user, PASSWORD, "new-password-1", "new-password-2");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.errorPasswordsNotMatching"),
      );
      expect(api.state.password).toBe(PASSWORD);
    });

    it("should show the server error when the current password is wrong", async () => {
      const user = await openPasswordForm();

      await fillPasswordForm(user, "wrong-one", "new-password", "new-password");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Current password is incorrect",
      );
      expect(
        screen.getByLabelText(t("pages.profile.currentPassword")),
      ).toBeInTheDocument();
    });

    it("should change the password and close the form", async () => {
      const user = await openPasswordForm();

      await fillPasswordForm(user, PASSWORD, "new-password", "new-password");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        t("pages.profile.successPasswordChanged"),
      );
      expect(api.state.password).toBe("new-password");
      expect(
        screen.queryByLabelText(t("pages.profile.currentPassword")),
      ).not.toBeInTheDocument();
    });
  });

  it("should sign out and return to the login page", async () => {
    const user = userEvent.setup();
    await renderProfile();
    const logout = screen.getByRole("heading", {
      level: 2,
      name: t("pages.profile.logoutSection"),
    }).parentElement!;

    expect(logout).toHaveTextContent(t("pages.profile.logoutDescription"));
    await user.click(
      within(logout).getByRole("button", { name: t("pages.profile.logout") }),
    );

    expect(auth.signOut).toHaveBeenCalledWith({
      redirect: true,
      callbackUrl: "/login",
    });
  });
});
