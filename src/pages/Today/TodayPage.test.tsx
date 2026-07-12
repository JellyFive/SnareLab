import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { SessionRepository } from "../../repositories/sessionRepository";
import { savePendingSessionDraft } from "../../services/pendingSessionDraftService";
import { TodayPage } from "./TodayPage";

describe("TodayPage", () => {
  let database: SnareLabDatabase;

  beforeEach(async () => {
    database = new SnareLabDatabase(`today-page-${crypto.randomUUID()}`);
    await database.open();
    await ensureDefaultCategories(database);
    await ensurePresetTags(database);
    const sessions = new SessionRepository(database);

    await sessions.saveSession({ id: "today-fundamentals", startTime: new Date(2026, 6, 12, 9, 10), endTime: new Date(2026, 6, 12, 9, 28), duration: 1_080, categoryId: "fundamentals", tagIds: ["double-stroke", "control"], note: "右手第二拍容易抢。" });
    await sessions.saveSession({ id: "today-song", startTime: new Date(2026, 6, 12, 19, 30), endTime: new Date(2026, 6, 12, 19, 54), duration: 1_440, categoryId: "song-practice", tagIds: ["fill"], note: "副歌进入前的过门需要更稳。" });
    await sessions.saveSession({ id: "july-four", startTime: new Date(2026, 6, 4, 10), endTime: new Date(2026, 6, 4, 10, 30), duration: 1_800, categoryId: "coordination", tagIds: [], note: "脚部练习" });
    await sessions.saveSession({ id: "june", startTime: new Date(2026, 5, 28, 10), endTime: new Date(2026, 5, 28, 10, 20), duration: 1_200, categoryId: "free-practice", tagIds: [], note: "六月记录" });
  });

  afterEach(async () => {
    cleanup();
    await database.delete();
  });

  it("shows Chinese today and all-time duration cards, a compact monthly summary, and every record for today", async () => {
    renderToday(<TodayPage database={database} initialDate={new Date(2026, 6, 12, 12)} />);

    expect(await screen.findByText("42 分钟")).toBeVisible();
    expect(screen.getByText("今日练习时长")).toBeVisible();
    expect(screen.getByText("总练习时长")).toBeVisible();
    expect(screen.getByText("1 小时 32 分钟")).toBeVisible();
    expect(screen.getByText("Jul 12")).toBeVisible();
    expect(screen.getAllByText("本月练习")).toHaveLength(2);
    expect(screen.getByTestId("month-practice-days")).toHaveAttribute("aria-label", "2 天");
    expect(screen.getByText("累计 1 小时 12 分钟")).toBeVisible();
    expect(screen.getByRole("heading", { name: "今日练习记录" })).toBeVisible();
    expect(screen.getByText("基本功")).toBeVisible();
    expect(screen.getByText("曲目练习")).toBeVisible();
    expect(screen.getByText("双跳")).toBeVisible();
    expect(screen.getByText("过门")).toBeVisible();
    expect(screen.getByText("右手第二拍容易抢。")).toBeVisible();
    expect(screen.queryByRole("button", { name: /基本功/i })).not.toBeInTheDocument();
  });

  it("changes the compact heatmap and monthly summary when navigating months", async () => {
    const user = userEvent.setup();
    renderToday(<TodayPage database={database} initialDate={new Date(2026, 6, 12, 12)} />);

    await screen.findByText("累计 1 小时 12 分钟");
    await user.click(screen.getByRole("button", { name: "上个月" }));

    expect(screen.getByText("6 月")).toBeVisible();
    expect(screen.getByTestId("month-practice-days")).toHaveAttribute("aria-label", "1 天");
    expect(screen.getByText("累计 20 分钟")).toBeVisible();
  });

  it("shows a Chinese recoverable-draft prompt", async () => {
    await savePendingSessionDraft(database, { id: "draft", startTime: new Date(2026, 6, 12, 8), endTime: new Date(2026, 6, 12, 8, 10), duration: 600, attachments: [], createdAt: new Date(2026, 6, 12, 8, 10) });
    renderToday(<TodayPage database={database} initialDate={new Date(2026, 6, 12, 12)} />);

    expect(await screen.findByText("有一条尚未保存的练习")).toBeVisible();
    expect(screen.getByRole("button", { name: "继续保存" })).toBeVisible();
    expect(screen.getByRole("button", { name: "放弃草稿" })).toBeVisible();
  });

  it("shows a Chinese empty state when today has no practice records", async () => {
    renderToday(<TodayPage database={database} initialDate={new Date(2026, 6, 13, 12)} />);

    await waitFor(() => expect(screen.getByText("今天还没有练习记录")).toBeVisible());
  });
});

function renderToday(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}
