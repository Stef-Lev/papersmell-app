import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import BiblionetCopyForm from "./biblionet-copy-form";

describe("BiblionetCopyForm", () => {
  it("should offer barcode scanning and explain when it is unsupported", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <ToastProvider>
        <BiblionetCopyForm />
      </ToastProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: t("libraryWorkspace.scanBarcode"),
      }),
    );

    await waitFor(() =>
      expect(
        within(
          screen.getByRole("region", { name: t("notifications.label") }),
        ).getByText(t("libraryWorkspace.scannerUnsupported")),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", {
        name: t("libraryWorkspace.stopScan"),
      }),
    ).not.toBeInTheDocument();
  });
});
