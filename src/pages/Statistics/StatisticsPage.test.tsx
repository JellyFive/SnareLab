import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { SessionRepository } from "../../repositories/sessionRepository";
import { StatisticsPage } from "./StatisticsPage";

const databaseName = () => `snarelab-statistics-page-test-${crypto.randomUUID()}`;

describe("StatisticsPage", () => {
  let database: SnareLabDatabase;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
    await ensureDefaultCategories(database);
    await ensurePresetTags(database);
    const sessions = new SessionRepository(database);
    await sessions.saveSession({ id: "fundamentals", startTime: new Date(2026, 6, 4, 9), endTime: new Date(2026, 6, 4, 9, 30), duration: 1_800, categoryId: "fundamentals", tagIds: ["timing"] });
    await sessions.saveSession({ id: "coordination", startTime: new Date(2026, 6, 5, 9), endTime: new Date(2026, 6, 5, 9, 20), duration: 1_200, categoryId: "coordination", tagIds: ["independence"] });
  });

  afterEach(async () => { cleanup(); await database.delete(); });

  it("drills from the annual overview into a month, a day, and its saved record", async () => {
    const user = userEvent.setup();
    render(<StatisticsPage database={database} now={new Date(2026, 6, 5, 15)} />);

    expect(await screen.findByRole("heading", { name: "年度练习热力图" })).toBeVisible();
    expect(screen.getAllByTestId("annual-heatmap-week")).toHaveLength(53);
    expect(screen.getByText("练习天数")).toBeVisible();
    expect(screen.getByText("连续练习")).toBeVisible();
    await user.click(await screen.findByRole("button", { name: /7 月2 天练习50 分/ }));
    expect(screen.getByRole("heading", { level: 1, name: "2026年7月" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "日历热力图" })).toBeVisible();
    expect(screen.getAllByText("30 分").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "近期练习记录" })).toBeVisible();
    expect(screen.getByRole("button", { name: /基本功.*30 分/ })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /2026 年 7 月 5 日/ }));
    expect(screen.getByRole("heading", { level: 1, name: "2026年7月5日 周日" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "分类分布" })).toBeVisible();
    expect(screen.getAllByText("手脚协调")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "返回上一级" }));
    expect(screen.getByRole("heading", { level: 1, name: "2026年7月" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /2026 年 7 月 5 日/ }));
    await user.click(screen.getByRole("button", { name: /手脚协调/ }));
    expect(screen.getByRole("dialog", { name: "练习记录详情" })).toBeVisible();
  });

  it("renders an empty annual overview without blanking the heatmap", async () => {
    await database.sessions.clear();
    render(<StatisticsPage database={database} now={new Date(2026, 6, 5, 15)} />);

    expect(await screen.findByRole("heading", { name: "年度练习热力图" })).toBeVisible();
    expect(screen.getAllByTestId("annual-heatmap-week")).toHaveLength(53);
    expect(screen.getAllByText("0 分").length).toBeGreaterThan(0);
  });

  it("switches to category and tag duration analysis", async () => {
    const user = userEvent.setup();
    render(<StatisticsPage database={database} now={new Date(2026, 6, 5, 15)} />);

    await user.click(await screen.findByRole("button", { name: "分类" }));
    expect(screen.getByRole("heading", { name: "分类时长分布" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "各月练习时长" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "分类明细" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "标签" }));
    expect(screen.getByRole("heading", { name: "标签时长排行" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "标签组合分析" })).toBeVisible();
  });
});
