import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../../database/dexie";
import {
  ensureDefaultCategories,
  ensurePresetTags,
} from "../../database/seedDefaults";
import { SessionRepository } from "../../repositories/sessionRepository";
import { LogPage } from "./LogPage";

const databaseName = () => `snarelab-log-page-test-${crypto.randomUUID()}`;

describe("LogPage", () => {
  let database: SnareLabDatabase;
  let sessions: SessionRepository;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
    await ensureDefaultCategories(database);
    await ensurePresetTags(database);
    sessions = new SessionRepository(database);

    await sessions.saveSession({
      id: "fundamentals-july-4",
      startTime: new Date(2026, 6, 4, 9),
      endTime: new Date(2026, 6, 4, 9, 10),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["timing"],
      note: "Even strokes",
    });
    await sessions.saveSession({
      id: "coordination-july-12",
      startTime: new Date(2026, 6, 12, 11),
      endTime: new Date(2026, 6, 12, 11, 30),
      duration: 1_800,
      categoryId: "coordination",
      tagIds: ["independence"],
      note: "Left foot",
    });
    await sessions.saveSession({
      id: "song-july-12",
      startTime: new Date(2026, 6, 12, 16),
      endTime: new Date(2026, 6, 12, 16, 20),
      duration: 1_200,
      categoryId: "song-practice",
      tagIds: ["groove"],
      note: "Verse groove",
    });
  });

  afterEach(async () => {
    cleanup();
    await database.delete();
  });

  it("shows practice intensity and changes the selected-day record list", async () => {
    const user = userEvent.setup();

    render(<LogPage database={database} initialMonth={new Date(2026, 6, 1)} />);

    const julyFour = await screen.findByRole("button", { name: /July 4, 2026/i });
    await waitFor(() => expect(julyFour).toHaveAttribute("data-intensity", "1"));
    await user.click(julyFour);
    expect(await screen.findByText("Even strokes")).toBeVisible();
    expect(screen.queryByText("Left foot")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /July 12, 2026/i }));
    expect(await screen.findByText("Left foot")).toBeVisible();
    expect(screen.getByText("Verse groove")).toBeVisible();
    expect(screen.queryByText("Even strokes")).not.toBeInTheDocument();
  });

  it("filters records by category, tag, date, and duration", async () => {
    const user = userEvent.setup();

    render(<LogPage database={database} initialMonth={new Date(2026, 6, 1)} />);
    await screen.findByRole("button", { name: /July 4, 2026/i });
    await user.click(screen.getByRole("button", { name: /Filter practice log/i }));

    await user.click(screen.getByRole("checkbox", { name: "Fundamentals" }));
    await user.click(screen.getByRole("checkbox", { name: "Timing" }));
    await user.type(screen.getByLabelText("Start date"), "2026-07-04");
    await user.type(screen.getByLabelText("End date"), "2026-07-04");
    await user.type(screen.getByLabelText("Minimum duration in minutes"), "10");
    await user.type(screen.getByLabelText("Maximum duration in minutes"), "10");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => expect(screen.getByText("Even strokes")).toBeVisible());
    expect(screen.queryByText("Left foot")).not.toBeInTheDocument();
    expect(screen.queryByText("Verse groove")).not.toBeInTheDocument();
  });

  it("views, edits, and permanently deletes a selected record", async () => {
    const user = userEvent.setup();

    render(<LogPage database={database} initialMonth={new Date(2026, 6, 1)} />);
    await user.click(await screen.findByRole("button", { name: /July 4, 2026/i }));
    await user.click(await screen.findByRole("button", { name: /Even strokes/i }));

    expect(screen.getByText("Duration")).toBeVisible();
    expect(screen.getByText("Start time")).toBeVisible();
    expect(screen.getByText("End time")).toBeVisible();
    const recordSheet = screen.getByRole("dialog", { name: "Practice record" });
    expect(within(recordSheet).getByText("Fundamentals")).toBeVisible();
    expect(within(recordSheet).getByText("Timing")).toBeVisible();
    expect(within(recordSheet).getByText("Even strokes")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Edit record" }));
    expect(screen.getByLabelText("Duration")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Start time")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("End time")).toHaveAttribute("readonly");
    await user.clear(screen.getByLabelText("Note"));
    await user.type(screen.getByLabelText("Note"), "Refined note");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Edit record" })).toBeVisible(),
    );
    expect(within(screen.getByRole("dialog", { name: "Practice record" })).getByText("Refined note")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete practice record" }));
    expect(screen.getByText(/permanently delete this practice record/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel deletion" }));
    expect(screen.getAllByText("Refined note")[0]).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete practice record" }));
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    await waitFor(() =>
      expect(screen.queryByText("Refined note")).not.toBeInTheDocument(),
    );
  });
});
