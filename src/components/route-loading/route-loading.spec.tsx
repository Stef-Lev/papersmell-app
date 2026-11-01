import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RouteLoading from "./route-loading";

describe("RouteLoading", () => {
  it("should render a busy status indicator", () => {
    render(<RouteLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveClass("loading");
  });

  it("should hide the decorative logo from assistive technology", () => {
    render(<RouteLoading />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    expect(status.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
