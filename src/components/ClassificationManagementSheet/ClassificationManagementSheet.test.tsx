import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import { ClassificationManagementSheet } from "./ClassificationManagementSheet";

const databaseName = () => `snarelab-management-sheet-test-${crypto.randomUUID()}`;

describe("ClassificationManagementSheet", () => {
  let database: SnareLabDatabase;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
    await ensureDefaultCategories(database);
    await ensurePresetTags(database);
  });

  afterEach(async () => {
    cleanup();
    await database.delete();
  });

  it("creates a category from the settings management sheet and notifies dependents", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    render(<ClassificationManagementSheet database={database} kind="category" onChanged={onChanged} onClose={vi.fn()} />);

    expect(await screen.findByText("基本功")).toBeVisible();
    expect(screen.getByText("系统分类")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "新建分类" }));
    await user.type(screen.getByLabelText("分类名称"), "热身");
    await user.click(screen.getByRole("button", { name: "保存分类" }));

    expect(await screen.findByText("热身")).toBeVisible();
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("confirms category deletion and migrates related records to uncategorized", async () => {
    const user = userEvent.setup();
    const category = await new CategoryRepository(database).createCategory({ color: "#535BF2", icon: "folder", name: "待删除分类" });
    const session = await new SessionRepository(database).saveSession({
      attachments: [],
      categoryId: category.id,
      duration: 60,
      endTime: new Date("2026-07-13T10:01:00"),
      note: "",
      startTime: new Date("2026-07-13T10:00:00"),
      tagIds: [],
    });
    render(<ClassificationManagementSheet database={database} kind="category" onChanged={vi.fn()} onClose={vi.fn()} />);

    expect(await screen.findByText("待删除分类")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "更多待删除分类操作" }));
    await user.click(screen.getByRole("menuitem", { name: "删除分类" }));
    expect(screen.getByText(/关联练习记录会自动归入“未分类”/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "确认删除" }));

    expect(await screen.findByRole("button", { name: "新建分类" })).toBeVisible();
    expect((await new SessionRepository(database).findById(session.id))?.categoryId).toBe("uncategorized");
  });

  it("confirms tag deletion and preserves the related record", async () => {
    const user = userEvent.setup();
    const tag = await new TagRepository(database).createTag({ name: "待删除标签" });
    const session = await new SessionRepository(database).saveSession({
      attachments: [],
      categoryId: "fundamentals",
      duration: 60,
      endTime: new Date("2026-07-13T10:01:00"),
      note: "",
      startTime: new Date("2026-07-13T10:00:00"),
      tagIds: [tag.id],
    });
    render(<ClassificationManagementSheet database={database} kind="tag" onChanged={vi.fn()} onClose={vi.fn()} />);

    expect(await screen.findByText("待删除标签")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "更多待删除标签操作" }));
    await user.click(screen.getByRole("menuitem", { name: "删除标签" }));
    expect(screen.getByText(/练习记录本身会保留/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "确认删除" }));

    expect(await screen.findByRole("button", { name: "新建标签" })).toBeVisible();
    expect(await new SessionRepository(database).findById(session.id)).toMatchObject({ id: session.id, tagIds: [] });
  });

  it("filters tags and exposes edit, statistics, and deletion from the more menu", async () => {
    const user = userEvent.setup();
    render(<ClassificationManagementSheet database={database} kind="tag" onChanged={vi.fn()} onClose={vi.fn()} />);

    expect(await screen.findByText("控制")).toBeVisible();
    await user.type(screen.getByRole("searchbox", { name: "搜索标签" }), "控制");
    expect(screen.getByText("控制")).toBeVisible();
    expect(screen.queryByText("双跳")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "更多控制操作" }));
    await expect(screen.getByRole("menuitem", { name: "编辑标签" })).toBeVisible();
    await expect(screen.getByRole("menuitem", { name: "查看统计" })).toBeVisible();
    await expect(screen.getByRole("menuitem", { name: "删除标签" })).toBeVisible();
    await user.click(screen.getByRole("menuitem", { name: "编辑标签" }));
    expect(screen.getByRole("dialog", { name: "编辑标签" })).toBeVisible();
    expect(screen.getByLabelText("标签名称")).toHaveValue("Control");
    expect(screen.getByLabelText("标签颜色")).toHaveValue("#8d4be8");
  });

  it("shows the selected tag usage statistics", async () => {
    const user = userEvent.setup();
    const session = await new SessionRepository(database).saveSession({
      attachments: [],
      categoryId: "fundamentals",
      duration: 900,
      endTime: new Date("2026-07-13T10:15:00"),
      note: "",
      startTime: new Date("2026-07-13T10:00:00"),
      tagIds: ["control"],
    });
    render(<ClassificationManagementSheet database={database} kind="tag" onChanged={vi.fn()} onClose={vi.fn()} />);

    expect(await screen.findByText("控制")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "更多控制操作" }));
    await user.click(screen.getByRole("menuitem", { name: "查看统计" }));

    const dialog = screen.getByRole("dialog", { name: "控制统计" });
    expect(dialog).toHaveTextContent("使用次数");
    expect(dialog).toHaveTextContent("1 条练习记录");
    expect(dialog).toHaveTextContent("15 分钟");
    expect(await new SessionRepository(database).findById(session.id)).toBeDefined();
  });

  it("uses the shared sheet form style for a new tag", async () => {
    const user = userEvent.setup();
    render(<ClassificationManagementSheet database={database} kind="tag" onChanged={vi.fn()} onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "新建标签" }));

    const dialog = screen.getByRole("dialog", { name: "新建标签" });
    expect(dialog).toHaveTextContent("为标签设置名称和颜色");
    expect(screen.getByLabelText("标签名称")).toBeVisible();
    expect(screen.getByRole("button", { name: "选择靛蓝色" })).toBeVisible();
    expect(screen.getByRole("button", { name: "选择珊瑚色" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "选择珊瑚色" }));
    expect(screen.getByLabelText("标签颜色")).toHaveValue("#f26f45");
  });
});
