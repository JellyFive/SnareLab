import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("renders the product brand, page title, and Chinese settings control", () => {
    render(<AppHeader onOpenSettings={vi.fn()} title="记录" />);

    expect(screen.getByRole("img", { name: "SnareLab 标识" })).toBeInTheDocument();
    expect(screen.getByText("SnareLab")).toHaveClass("app-header__brand-name");
    expect(screen.getByRole("heading", { level: 1, name: "记录" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开设置" })).toBeInTheDocument();
  });
});
