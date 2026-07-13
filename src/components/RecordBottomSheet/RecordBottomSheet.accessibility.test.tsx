import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Category, PracticeSession, Tag } from "../../types";
import { RecordBottomSheet } from "./RecordBottomSheet";

const session: PracticeSession = {
  id: "session-1",
  startTime: new Date(2026, 6, 4, 9),
  endTime: new Date(2026, 6, 4, 9, 10),
  duration: 600,
  categoryId: "fundamentals",
  tagIds: ["control"],
  attachments: [{
    id: "attachment-1",
    blob: new Blob(["image"], { type: "image/jpeg" }),
    mimeType: "image/jpeg",
    fileName: "练习照片.jpg",
    size: 5,
    createdAt: new Date(2026, 6, 4, 9),
    sortOrder: 0,
  }],
  createdAt: new Date(2026, 6, 4, 9),
  updatedAt: new Date(2026, 6, 4, 9),
};

const categories: Category[] = [
  { id: "fundamentals", name: "Fundamentals", icon: "drum", color: "#4C7FE8", isSystem: false, createdAt: new Date(), updatedAt: new Date() },
  { id: "coordination", name: "Coordination", icon: "drum", color: "#7B61D9", isSystem: false, createdAt: new Date(), updatedAt: new Date() },
];
const tags: Tag[] = [{ id: "control", name: "Control", isPreset: true, createdAt: new Date(), updatedAt: new Date() }];

describe("RecordBottomSheet accessibility", () => {
  it("moves initial keyboard focus to the Chinese sheet close control", async () => {
    render(<RecordBottomSheet categories={categories} onClose={vi.fn()} onDelete={vi.fn()} onSave={vi.fn()} session={session} tags={tags} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "关闭记录详情" })).toHaveFocus());
  });

  it("shows Chinese timer facts and attachments while keeping timer facts read-only", () => {
    render(<RecordBottomSheet categories={categories} onClose={vi.fn()} onDelete={vi.fn()} onSave={vi.fn()} session={session} tags={tags} />);

    expect(screen.getByRole("heading", { name: "练习记录" })).toBeInTheDocument();
    expect(screen.getByLabelText("练习时长")).toHaveValue("10 分钟");
    expect(screen.getByLabelText("练习时间")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("练习时间")).toHaveValue("2026年7月4日 09:00 - 09:10");
    expect(screen.queryByLabelText("开始时间")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("结束时间")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "附件：练习照片.jpg" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑记录" })).toBeInTheDocument();
  });

  it("saves attachment changes with metadata while never submitting timer facts", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RecordBottomSheet categories={categories} onClose={vi.fn()} onDelete={vi.fn()} onSave={onSave} session={session} tags={tags} />);

    await user.click(screen.getByRole("button", { name: "编辑记录" }));
    await user.click(screen.getByRole("button", { name: "选择练习分类" }));
    await user.click(screen.getByRole("option", { name: "手脚协调" }));
    await user.click(screen.getByRole("button", { name: "删除练习照片.jpg" }));
    await user.clear(screen.getByLabelText("备注"));
    await user.type(screen.getByLabelText("备注"), "调整后的备注");
    await user.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith("session-1", {
      attachments: [],
      categoryId: "coordination",
      note: "调整后的备注",
      tagIds: ["control"],
    }));
  });

  it("shows a Chinese save error and keeps the edit sheet open when saving fails", async () => {
    const user = userEvent.setup();
    render(<RecordBottomSheet categories={categories} onClose={vi.fn()} onDelete={vi.fn()} onSave={vi.fn().mockRejectedValue(new Error("offline"))} session={session} tags={tags} />);

    await user.click(screen.getByRole("button", { name: "编辑记录" }));
    await user.click(screen.getByRole("button", { name: "保存修改" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("记录保存失败，请重试。");
    expect(screen.getByRole("heading", { name: "编辑记录" })).toBeVisible();
  });

  it("closes the sheet when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<RecordBottomSheet categories={categories} onClose={onClose} onDelete={vi.fn()} onSave={vi.fn()} session={session} tags={tags} />);

    fireEvent.keyDown(screen.getByRole("dialog", { name: "练习记录详情" }), { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("requires an explicit Chinese confirmation before hard deletion", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<RecordBottomSheet categories={categories} onClose={onClose} onDelete={onDelete} onSave={vi.fn()} session={session} tags={tags} />);

    await user.click(screen.getByRole("button", { name: "删除记录" }));
    expect(screen.getByText("删除后无法恢复这条练习记录。")).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "确认删除" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("session-1"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
