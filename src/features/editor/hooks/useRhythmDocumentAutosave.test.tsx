import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultRhythmDocument } from "../domain/rhythmCommands";
import { useEditorStore } from "../../../store/editorStore";
import { useRhythmDocumentAutosave } from "./useRhythmDocumentAutosave";

describe("useRhythmDocumentAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useEditorStore.setState({
      document: undefined,
      undoStack: [],
      redoStack: [],
      saveStatus: "idle",
      saveError: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("waits 300ms before saving", async () => {
    const document = createDefaultRhythmDocument("测试节奏");
    const repository = { save: vi.fn().mockResolvedValue(document) };
    renderHook(() =>
      useRhythmDocumentAutosave({ document, repository, delayMs: 300 }),
    );

    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(repository.save).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(repository.save).toHaveBeenCalledOnce();
    expect(repository.save).toHaveBeenCalledWith(document);
    expect(useEditorStore.getState().saveStatus).toBe("saved");
  });

  it("coalesces rapid edits into one save of the newest document", async () => {
    const initial = createDefaultRhythmDocument("测试节奏");
    const repository = { save: vi.fn().mockResolvedValue(initial) };
    const { rerender } = renderHook(
      ({ document }) =>
        useRhythmDocumentAutosave({ document, repository, delayMs: 300 }),
      { initialProps: { document: initial } },
    );

    await act(() => vi.advanceTimersByTimeAsync(200));
    const latest = { ...initial, bpm: 132 };
    rerender({ document: latest });
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(repository.save).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(repository.save).toHaveBeenCalledOnce();
    expect(repository.save).toHaveBeenCalledWith(latest);
  });

  it("flushes the pending document immediately", async () => {
    const document = createDefaultRhythmDocument("测试节奏");
    const repository = { save: vi.fn().mockResolvedValue(document) };
    const { result } = renderHook(() =>
      useRhythmDocumentAutosave({ document, repository, delayMs: 300 }),
    );

    await act(async () => result.current.flush());

    expect(repository.save).toHaveBeenCalledOnce();
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it("keeps the in-memory document on failure and retries the same revision", async () => {
    const document = createDefaultRhythmDocument("测试节奏");
    const repository = {
      save: vi
        .fn()
        .mockRejectedValueOnce(new Error("IndexedDB unavailable"))
        .mockResolvedValueOnce(document),
    };
    useEditorStore.getState().openDocument(document);
    const { result } = renderHook(() =>
      useRhythmDocumentAutosave({ document, repository, delayMs: 300 }),
    );

    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(useEditorStore.getState()).toMatchObject({
      document,
      saveStatus: "error",
      saveError: "IndexedDB unavailable",
    });

    await act(async () => result.current.retry());
    expect(repository.save).toHaveBeenNthCalledWith(2, document);
    expect(useEditorStore.getState().saveStatus).toBe("saved");
  });

  it("does not let an older completion overwrite a newer save state", async () => {
    const first = createDefaultRhythmDocument("测试节奏");
    let resolveFirst!: () => void;
    let rejectSecond!: (error: Error) => void;
    const repository = {
      save: vi
        .fn()
        .mockImplementationOnce(
          () => new Promise<typeof first>((resolve) => {
            resolveFirst = () => resolve(first);
          }),
        )
        .mockImplementationOnce(
          () => new Promise<typeof first>((_, reject) => {
            rejectSecond = reject;
          }),
        ),
    };
    const { rerender } = renderHook(
      ({ document }) =>
        useRhythmDocumentAutosave({ document, repository, delayMs: 300 }),
      { initialProps: { document: first } },
    );

    await act(() => vi.advanceTimersByTimeAsync(300));
    const second = { ...first, bpm: 140 };
    rerender({ document: second });
    await act(() => vi.advanceTimersByTimeAsync(300));

    await act(async () => rejectSecond(new Error("newest failed")));
    expect(useEditorStore.getState().saveStatus).toBe("error");
    await act(async () => resolveFirst());

    expect(useEditorStore.getState()).toMatchObject({
      saveStatus: "error",
      saveError: "newest failed",
    });
  });

  it("invalidates an in-flight completion when the hook unmounts", async () => {
    const document = createDefaultRhythmDocument("旧文档");
    let resolveOld!: () => void;
    const oldRepository = {
      save: vi.fn().mockImplementation(
        () => new Promise<typeof document>((resolve) => {
          resolveOld = () => resolve(document);
        }),
      ),
    };
    const oldHook = renderHook(() =>
      useRhythmDocumentAutosave({
        document,
        repository: oldRepository,
        delayMs: 300,
      }),
    );
    await act(() => vi.advanceTimersByTimeAsync(300));
    oldHook.unmount();

    const newDocument = { ...document, id: "new-document", name: "新文档" };
    let rejectNew!: (error: Error) => void;
    const newRepository = {
      save: vi.fn().mockImplementation(
        () => new Promise<typeof document>((_, reject) => {
          rejectNew = reject;
        }),
      ),
    };
    renderHook(() =>
      useRhythmDocumentAutosave({
        document: newDocument,
        repository: newRepository,
        delayMs: 300,
      }),
    );
    await act(() => vi.advanceTimersByTimeAsync(300));
    await act(async () => rejectNew(new Error("new save failed")));
    expect(useEditorStore.getState().saveStatus).toBe("error");

    await act(async () => resolveOld());
    expect(useEditorStore.getState()).toMatchObject({
      saveStatus: "error",
      saveError: "new save failed",
    });
  });
});
