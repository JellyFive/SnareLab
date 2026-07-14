import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "./App";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("App shell", () => {
  it.each([
    ["/", "Today"],
    ["/records", "记录"],
    ["/statistics", "统计"],
    ["/editor", "节奏编辑器"],
  ])("renders %s as the %s route", (path, pageTitle) => {
    window.history.replaceState({}, "", path);

    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: pageTitle }),
    ).toBeInTheDocument();
  });

  it("renders the timer route with its primary start control", () => {
    window.history.replaceState({}, "", "/timer");
    render(<App />);

    expect(screen.getByRole("button", { name: "开始练习计时" })).toBeInTheDocument();
  });

  it("moves between V0.3 primary destinations and marks the active tab", async () => {
    const user = userEvent.setup();

    render(<App />);

    for (const [label, pageTitle] of [["记录", "记录"], ["统计", "统计"], ["编辑", "节奏编辑器"], ["今日", "Today"]]) {
      await user.click(screen.getByRole("link", { name: label }));

      expect(screen.getByRole("heading", { level: 1, name: pageTitle })).toBeVisible();
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
  });

  it("gives every primary navigation control an accessible name", () => {
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "主导航" });
    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(4);
    expect(navigation).toContainElement(links[0]);

    for (const link of links) {
      expect(link).toHaveAccessibleName();
    }
  });

  it("redirects the legacy log address to records", () => {
    window.history.replaceState({}, "", "/log");

    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "记录" })).toBeInTheDocument();
  });
});
