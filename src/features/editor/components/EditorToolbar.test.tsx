import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDefaultRhythmDocument } from "../domain/rhythmCommands";
import { EditorToolbar } from "./EditorToolbar";

describe("EditorToolbar", () => {
  it("shows save state and validates rename before confirmation", async () => {
    const user = userEvent.setup();
    const document = createDefaultRhythmDocument("主歌");
    const onRenameDocument = vi.fn().mockResolvedValue(undefined);
    render(<EditorToolbar documents={[document]} activeDocument={document}
      canUndo={false} canRedo={false} saveStatus="error"
      onSelectDocument={vi.fn()} onCreateDocument={vi.fn()}
      onRenameDocument={onRenameDocument} onDeleteDocument={vi.fn()}
      onUndo={vi.fn()} onRedo={vi.fn()} onRetrySave={vi.fn()} />);
    expect(screen.getByText("保存失败")).toBeVisible();
    expect(screen.getByRole("button", { name: "重试保存" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "重命名" }));
    await user.clear(screen.getByRole("textbox", { name: "节奏名称" }));
    await user.click(screen.getByRole("button", { name: "确认重命名" }));
    expect(screen.getByRole("alert")).toHaveTextContent("请输入节奏名称");
    expect(onRenameDocument).not.toHaveBeenCalled();
  });

  it("requires explicit deletion confirmation", async () => {
    const user = userEvent.setup();
    const document = createDefaultRhythmDocument("主歌");
    const onDeleteDocument = vi.fn().mockResolvedValue(undefined);
    render(<EditorToolbar documents={[document]} activeDocument={document}
      canUndo canRedo saveStatus="saved" onSelectDocument={vi.fn()}
      onCreateDocument={vi.fn()} onRenameDocument={vi.fn()}
      onDeleteDocument={onDeleteDocument} onUndo={vi.fn()} onRedo={vi.fn()}
      onRetrySave={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "删除节奏" }));
    expect(onDeleteDocument).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "确认删除节奏" }));
    expect(onDeleteDocument).toHaveBeenCalledOnce();
  });
});
