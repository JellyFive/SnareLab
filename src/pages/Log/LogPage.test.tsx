import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { SessionRepository } from "../../repositories/sessionRepository";
import { LogPage } from "./LogPage";

const databaseName = () => `snarelab-records-page-test-${crypto.randomUUID()}`;

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
      note: "均匀击打",
    });
    await sessions.saveSession({
      id: "coordination-july-12",
      startTime: new Date(2026, 6, 12, 11),
      endTime: new Date(2026, 6, 12, 11, 30),
      duration: 1_800,
      categoryId: "coordination",
      tagIds: ["independence"],
      note: "左脚控制",
      attachments: [{
        id: "image-1",
        blob: new Blob(["image"], { type: "image/jpeg" }),
        mimeType: "image/jpeg",
        fileName: "practice.jpg",
        size: 5,
        createdAt: new Date(2026, 6, 12, 11),
        sortOrder: 0,
      }],
    });
    await sessions.saveSession({
      id: "song-july-12",
      startTime: new Date(2026, 6, 12, 16),
      endTime: new Date(2026, 6, 12, 16, 20),
      duration: 1_200,
      categoryId: "song-practice",
      tagIds: ["groove", "timing", "speed"],
      note: "主歌律动",
    });
  });

  afterEach(async () => {
    cleanup();
    await database.delete();
  });

  it("groups records by local practice date in descending order on a compact timeline", async () => {
    render(<LogPage database={database} />);

    expect(await screen.findByRole("heading", { name: "2026 年 7 月 12 日" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "2026 年 7 月 4 日" })).toBeVisible();
    expect(screen.getByTestId("record-timeline")).toBeVisible();
    expect(screen.getByText("周日")).toBeVisible();

    const cards = screen.getAllByTestId("record-card");
    expect(cards.map((card) => card.textContent)).toEqual([
      expect.stringContaining("曲目练习"),
      expect.stringContaining("手脚协调"),
      expect.stringContaining("基本功"),
    ]);
    expect(within(cards[0]).getByText("律动")).toBeVisible();
    expect(within(cards[0]).queryByText("节奏")).not.toBeInTheDocument();
    expect(cards[0].querySelector(".record-card__accent")).toBeNull();
    expect(within(cards[1]).getByText("图片 1 张")).toBeVisible();
    expect(screen.getByTestId("record-entry-song-july-12")).toHaveTextContent("16:00");
    expect(screen.getByTestId("record-entry-coordination-july-12")).toHaveTextContent("11:00");
    expect(screen.getByTestId("record-entry-song-july-12").querySelector(".records-page__entry-time")).toHaveTextContent("16:00");
  });

  it("filters records by category and tag, supports combined filters, and clears them", async () => {
    const user = userEvent.setup();
    render(<LogPage database={database} />);

    await screen.findByText("主歌律动");
    await user.click(screen.getByRole("button", { name: "筛选练习记录" }));
    expect(screen.queryByLabelText("开始日期")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("最短时长（分钟）")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "曲目练习" }));
    await user.click(screen.getByRole("checkbox", { name: "节奏" }));
    await user.click(screen.getByRole("button", { name: "应用筛选" }));
    await waitFor(() => expect(screen.getByText("主歌律动")).toBeVisible());
    expect(screen.queryByText("左脚控制")).not.toBeInTheDocument();
    expect(screen.queryByText("均匀击打")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "筛选练习记录（2）" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "清除筛选" }));
    await waitFor(() => expect(screen.getByText("左脚控制")).toBeVisible());
    expect(screen.getByRole("button", { name: "筛选练习记录" })).toBeVisible();
  });

  it("shows a Chinese no-results state and opens a record detail sheet from the list", async () => {
    const user = userEvent.setup();
    render(<LogPage database={database} />);

    await screen.findByText("主歌律动");
    await user.click(screen.getByRole("button", { name: "筛选练习记录" }));
    await user.click(screen.getByRole("checkbox", { name: "自由练习" }));
    await user.click(screen.getByRole("button", { name: "应用筛选" }));
    expect(await screen.findByText("没有符合当前筛选条件的练习记录")).toBeVisible();
    expect(screen.getByRole("button", { name: "清除筛选" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "清除筛选" }));
    const record = await screen.findByRole("button", { name: /曲目练习.*16:00.*20 分钟/i });
    await user.click(record);
    expect(screen.getByRole("dialog", { name: "练习记录详情" })).toBeVisible();
    expect(screen.getByRole("button", { name: "编辑记录" })).toBeVisible();
  });
});
