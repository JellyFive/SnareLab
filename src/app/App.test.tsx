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
    ["/timer", "Timer"],
    ["/log", "Log"],
    ["/category", "Category & Tags"],
    ["/statistics", "Statistics"],
  ])("renders %s as the %s route", (path, pageTitle) => {
    window.history.replaceState({}, "", path);

    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: pageTitle }),
    ).toBeInTheDocument();
  });

  it("moves between every primary destination and marks the active tab", async () => {
    const user = userEvent.setup();

    render(<App />);

    for (const [label, pageTitle] of [["Log", "Log"], ["Category", "Category & Tags"], ["Statistics", "Statistics"], ["Today", "Today"]]) {
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

    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(4);
    expect(navigation).toContainElement(links[0]);

    for (const link of links) {
      expect(link).toHaveAccessibleName();
    }
  });
});
