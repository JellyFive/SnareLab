import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    await clearPendingSessionDraft(database);
    await ensureDefaultCategories(database);
    await ensurePresetTags(database);
  });

  afterEach(async () => {
    database.close();
    await database.delete();
  });

  it("requires a category and exposes optional tags and note", async () => {
    const user = userEvent.setup();
    useTimerStore.getState().start(new Date("2026-07-01T09:00:00.000Z"));
    useTimerStore.getState().finish(new Date("2026-07-01T09:01:00.000Z"));
    render(<MemoryRouter><TimerPage database={database} /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "保存本次练习" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存记录" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "选择练习分类" }));
    expect(await screen.findByRole("option", { name: "基本功" })).toBeInTheDocument();
    expect(await screen.findByLabelText("单跳")).toBeInTheDocument();
    expect(screen.getByLabelText("备注")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加图片" })).toBeInTheDocument();
  });

  it("restores a pending draft into the save sheet only after the recovery action", async () => {
    const user = userEvent.setup();
    await savePendingSessionDraft(database, { id: "draft-1", startTime: new Date("2026-07-01T09:00:00.000Z"), endTime: new Date("2026-07-01T09:02:00.000Z"), duration: 120, attachments: [], createdAt: new Date("2026-07-01T09:02:00.000Z") });
    render(<MemoryRouter initialEntries={[{ pathname: "/timer", state: { recoverDraft: true } }]}><TimerPage database={database} /></MemoryRouter>);

    expect(await screen.findByRole("dialog", { name: "保存本次练习" })).toHaveTextContent("02:00");
    await user.click(screen.getByRole("button", { name: "选择练习分类" }));
    expect(await screen.findByRole("option", { name: "未分类" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存记录" })).toBeDisabled();
    await expect(getPendingSessionDraft(database)).resolves.toMatchObject({ id: "draft-1", duration: 120 });
  });

  it("saves a recovered pending draft and clears it", async () => {
    const user = userEvent.setup();
    await savePendingSessionDraft(database, {
      id: "recovered-draft",
      startTime: new Date("2026-07-01T09:00:00.000Z"),
      endTime: new Date("2026-07-01T09:02:00.000Z"),
      duration: 120,
      categoryId: "fundamentals",
      tagIds: ["single-stroke"],
      note: "恢复后保存",
      attachments: [],
      createdAt: new Date("2026-07-01T09:02:00.000Z"),
    });
    render(<MemoryRouter initialEntries={[{ pathname: "/timer", state: { recoverDraft: true } }]}><TimerPage database={database} /></MemoryRouter>);

    const saveButton = await screen.findByRole("button", { name: "保存记录" });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(async () => expect((await database.sessions.toArray()).find((session) => session.note === "恢复后保存")).toMatchObject({ categoryId: "fundamentals", note: "恢复后保存" }));
    await expect(getPendingSessionDraft(database)).resolves.toBeUndefined();
  });

  it("keeps the selected category after confirming a new tag", async () => {
    const user = userEvent.setup();
    useTimerStore.getState().start(new Date("2026-07-01T09:00:00.000Z"));
    useTimerStore.getState().finish(new Date("2026-07-01T09:01:00.000Z"));
    render(<MemoryRouter><TimerPage database={database} /></MemoryRouter>);

    await user.click(await screen.findByRole("button", { name: "选择练习分类" }));
    await user.click(screen.getByRole("option", { name: "基本功" }));
    await user.click(screen.getByRole("button", { name: "添加标签" }));
    await user.type(screen.getByLabelText("新标签名称"), "重音控制");
    await user.click(screen.getByRole("button", { name: "确定" }));

    expect(screen.getByRole("button", { name: "选择练习分类" })).toHaveTextContent("基本功");
    expect(await screen.findByRole("checkbox", { name: "重音控制" })).toBeChecked();
  });
});
