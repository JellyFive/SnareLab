import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../../database/dexie";
import {
  ensureDefaultCategories,
  ensurePresetTags,
} from "../../database/seedDefaults";
import { SessionRepository } from "../../repositories/sessionRepository";
import { CategoryPage } from "./CategoryPage";

const databaseName = () => `snarelab-category-page-test-${crypto.randomUUID()}`;

describe("CategoryPage", () => {
  let database: SnareLabDatabase;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
    await ensureDefaultCategories(database);
    await ensurePresetTags(database);
    const sessions = new SessionRepository(database);
    await sessions.saveSession({
      id: "linked-session",
      startTime: new Date(2026, 6, 4, 9),
      endTime: new Date(2026, 6, 4, 9, 10),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["timing"],
    });
  });

  afterEach(async () => {
    cleanup();
    await database.delete();
  });

  it("switches between Category and Tags lists", async () => {
    const user = userEvent.setup();

    render(<CategoryPage database={database} />);

    expect(await screen.findByText("Fundamentals")).toBeVisible();
    expect(screen.queryByText("Single Stroke")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Tags" }));

    expect(await screen.findByText("Single Stroke")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Edit Fundamentals" })).not.toBeInTheDocument();
  });

  it("creates and edits a category", async () => {
    const user = userEvent.setup();

    render(<CategoryPage database={database} />);
    await screen.findByText("Fundamentals");
    await user.click(screen.getByRole("button", { name: "Add category" }));
    await user.type(screen.getByLabelText("Category name"), "Warmup");
    await user.click(screen.getByRole("button", { name: "Save category" }));

    expect(await screen.findByText("Warmup")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Edit Warmup" }));
    await user.clear(screen.getByLabelText("Category name"));
    await user.type(screen.getByLabelText("Category name"), "Daily Warmup");
    await user.click(screen.getByRole("button", { name: "Save category" }));

    expect(await screen.findByText("Daily Warmup")).toBeVisible();
  });

  it("confirms category deletion and migrates linked records to Uncategorized", async () => {
    const user = userEvent.setup();

    render(<CategoryPage database={database} />);
    await screen.findByText("Fundamentals");
    await user.click(screen.getByRole("button", { name: "Delete Fundamentals" }));
    expect(screen.getByText(/move to Uncategorized/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel deletion" }));
    expect(screen.getByText("Fundamentals")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete Fundamentals" }));
    await user.click(screen.getByRole("button", { name: "Delete category" }));
    await waitFor(() => expect(screen.queryByText("Fundamentals")).not.toBeInTheDocument());
    await expect(database.sessions.get("linked-session")).resolves.toMatchObject({
      categoryId: "uncategorized",
    });
  });

  it("creates and edits a tag", async () => {
    const user = userEvent.setup();

    render(<CategoryPage database={database} />);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await screen.findByText("Timing");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await user.type(screen.getByLabelText("Tag name"), "Accent");
    await user.click(screen.getByRole("button", { name: "Save tag" }));

    expect(await screen.findByText("Accent")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Edit Accent" }));
    await user.clear(screen.getByLabelText("Tag name"));
    await user.type(screen.getByLabelText("Tag name"), "Accents");
    await user.click(screen.getByRole("button", { name: "Save tag" }));

    expect(await screen.findByText("Accents")).toBeVisible();
  });

  it("confirms tag deletion while keeping linked records", async () => {
    const user = userEvent.setup();

    render(<CategoryPage database={database} />);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await screen.findByText("Timing");
    await user.click(screen.getByRole("button", { name: "Delete Timing" }));
    expect(screen.getByText(/removed from related practice records/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel deletion" }));
    expect(screen.getByText("Timing")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete Timing" }));
    await user.click(screen.getByRole("button", { name: "Delete tag" }));
    await waitFor(() => expect(screen.queryByText("Timing")).not.toBeInTheDocument());
    await expect(database.sessions.get("linked-session")).resolves.toMatchObject({
      tagIds: [],
    });
    await expect(database.sessions.get("linked-session")).resolves.toBeDefined();
  });
});
