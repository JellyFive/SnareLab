import "fake-indexeddb/auto";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnareLabDatabase } from "../../database/dexie";
import { RhythmDocumentRepository } from "../../repositories/rhythmDocumentRepository";
import { EditorPage } from "./EditorPage";
import { useEditorStore } from "../../store/editorStore";
import { toggleNote } from "../../features/editor/domain/rhythmCommands";

describe("EditorPage", () => {
  let database: SnareLabDatabase;
  let repository: RhythmDocumentRepository;
  beforeEach(() => {
    database = new SnareLabDatabase(`editor-page-${crypto.randomUUID()}`);
    repository = new RhythmDocumentRepository(database);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    useEditorStore.setState({ document: undefined, undoStack: [], redoStack: [], saveStatus: "idle", saveError: undefined });
  });
  afterEach(async () => { cleanup(); await new Promise((resolve) => setTimeout(resolve, 0)); vi.restoreAllMocks(); await database.delete(); });

  it("restores the remembered document and renders the silent editor workbench", async () => {
    const first = await repository.create("主歌");
    const second = await repository.create("副歌");
    await repository.rememberLastDocument(first.id);
    const { unmount } = render(<EditorPage repository={repository} />);
    expect(screen.getByRole("heading", { name: "节奏编辑器" })).toBeVisible();
    await waitFor(() => expect(screen.getByRole("combobox", { name: "选择节奏文档" })).toHaveValue(first.id));
    expect(screen.getByRole("grid", { name: "鼓组节奏网格" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /轨道/ })).toHaveLength(16);
    expect(screen.queryByText(/Library|五线谱|Count In|节拍器/)).not.toBeInTheDocument();
    expect(second.name).toBe("副歌");
    unmount();
  });

  it("flushes the old document before switching and remembers the new one", async () => {
    const user = userEvent.setup();
    const first = await repository.create("主歌");
    const second = await repository.create("副歌");
    await repository.rememberLastDocument(first.id);
    const save = vi.spyOn(repository, "save");
    const { unmount } = render(<EditorPage repository={repository} />);
    const selector = await screen.findByRole("combobox", { name: "选择节奏文档" });
    await waitFor(() => expect(selector).toHaveValue(first.id));
    await user.selectOptions(selector, second.id);
    await waitFor(() => expect(selector).toHaveValue(second.id));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }));
    await expect(database.editorPreferences.get("editor")).resolves.toMatchObject({ lastDocumentId: second.id });
    unmount();
  });

  it("stays on the current in-memory document when the pre-switch save fails", async () => {
    const user = userEvent.setup();
    const first = await repository.create("未保存主歌");
    const second = await repository.create("副歌");
    await repository.rememberLastDocument(first.id);
    vi.spyOn(repository, "save").mockRejectedValueOnce(new Error("disk unavailable"));
    render(<EditorPage repository={repository} />);
    const selector = await screen.findByRole("combobox", { name: "选择节奏文档" });
    await waitFor(() => expect(selector).toHaveValue(first.id));
    await user.selectOptions(selector, second.id);
    await waitFor(() => expect(screen.getByText("保存失败")).toBeVisible());
    expect(selector).toHaveValue(first.id);
    expect(useEditorStore.getState().document?.id).toBe(first.id);
  });

  it("flushes a pending edit when leaving the page", async () => {
    const initial = await repository.create("离页保存");
    await repository.rememberLastDocument(initial.id);
    const save = vi.spyOn(repository, "save");
    const { unmount } = render(<EditorPage repository={repository} />);
    await waitFor(() => expect(useEditorStore.getState().document?.id).toBe(initial.id));
    act(() => useEditorStore.getState().applyEdit(toggleNote("snare", 0)));
    unmount();
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({
      id: initial.id,
      notes: [expect.objectContaining({ trackId: "snare", tick: 0 })],
    })));
  });

  it("replaces the final deleted document with an unnamed rhythm", async () => {
    const user = userEvent.setup();
    const only = await repository.create("唯一节奏");
    await repository.rememberLastDocument(only.id);
    const { unmount } = render(<EditorPage repository={repository} />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "选择节奏文档" })).toHaveValue(only.id));
    await user.click(screen.getByRole("button", { name: "删除节奏" }));
    await user.click(screen.getByRole("button", { name: "确认删除节奏" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "选择节奏文档" })).toHaveDisplayValue("未命名节奏"));
    unmount();
  });
});
