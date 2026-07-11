import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { clearPendingSessionDraft, getPendingSessionDraft, savePendingSessionDraft } from "../../services/pendingSessionDraftService";
import { useTimerStore } from "../../store/timerStore";
import { TimerPage } from "./TimerPage";

describe("TimerPage", () => {
  let database: SnareLabDatabase;

  beforeEach(async () => {
    database = new SnareLabDatabase(`timer-page-${crypto.randomUUID()}`);
    useTimerStore.getState().reset();
    clearPendingSessionDraft();
    await ensureDefaultCategories(database);
    await ensurePresetTags(database);
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it("requires a category and exposes optional tags and note", async () => {
    useTimerStore.getState().start(new Date("2026-07-01T09:00:00.000Z"));
    useTimerStore.getState().finish(new Date("2026-07-01T09:01:00.000Z"));
    render(<MemoryRouter><TimerPage database={database} /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Save Session" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Record" })).toBeDisabled();
    expect(await screen.findByRole("option", { name: "Fundamentals" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Single Stroke")).toBeInTheDocument();
    expect(screen.getByLabelText("Note")).toBeInTheDocument();
  });

  it("restores a pending draft into the save sheet only after the recovery action", async () => {
    savePendingSessionDraft({ id: "draft-1", startTime: new Date("2026-07-01T09:00:00.000Z"), endTime: new Date("2026-07-01T09:02:00.000Z"), duration: 120, createdAt: new Date("2026-07-01T09:02:00.000Z") });
    render(<MemoryRouter initialEntries={[{ pathname: "/timer", state: { recoverDraft: true } }]}><TimerPage database={database} /></MemoryRouter>);

    expect(await screen.findByRole("dialog", { name: "Save Session" })).toHaveTextContent("02:00");
    expect(await screen.findByRole("option", { name: "Uncategorized" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Record" })).toBeDisabled();
    expect(getPendingSessionDraft()).toMatchObject({ id: "draft-1", duration: 120 });
  });
});
