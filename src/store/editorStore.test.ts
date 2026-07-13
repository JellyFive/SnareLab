import { beforeEach, describe, expect, it } from "vitest";

import { createDefaultRhythmDocument } from "../features/editor/domain/rhythmCommands";
import { useEditorStore } from "./editorStore";

function documentAt(bpm: number) {
  return { ...createDefaultRhythmDocument("测试节奏"), bpm };
}

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({
      document: undefined,
      undoStack: [],
      redoStack: [],
      saveStatus: "idle",
      saveError: undefined,
    });
  });

  it("opens a document and clears history and save errors", () => {
    useEditorStore.setState({
      undoStack: [documentAt(100)],
      redoStack: [documentAt(101)],
      saveStatus: "error",
      saveError: "disk full",
    });

    const opened = documentAt(120);
    useEditorStore.getState().openDocument(opened);

    expect(useEditorStore.getState()).toMatchObject({
      document: opened,
      undoStack: [],
      redoStack: [],
      saveStatus: "idle",
      saveError: undefined,
    });
  });

  it("applies immutable edits and supports undo and redo", () => {
    const initial = documentAt(120);
    useEditorStore.getState().openDocument(initial);
    useEditorStore.getState().applyEdit((document) => ({ ...document, bpm: 121 }));

    const edited = useEditorStore.getState().document;
    expect(edited).not.toBe(initial);
    expect(useEditorStore.getState().undoStack).toEqual([initial]);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document).toBe(initial);
    expect(useEditorStore.getState().redoStack).toEqual([edited]);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document).toBe(edited);
    expect(useEditorStore.getState().undoStack).toEqual([initial]);
  });

  it("does not add history for no-op edits", () => {
    const initial = documentAt(120);
    useEditorStore.getState().openDocument(initial);
    useEditorStore.getState().applyEdit((document) => document);

    expect(useEditorStore.getState().undoStack).toEqual([]);
    expect(useEditorStore.getState().document).toBe(initial);
  });

  it("keeps only the newest 100 undo snapshots", () => {
    useEditorStore.getState().openDocument(documentAt(100));
    for (let bpm = 101; bpm <= 201; bpm += 1) {
      useEditorStore.getState().applyEdit((document) => ({ ...document, bpm }));
    }

    const state = useEditorStore.getState();
    expect(state.undoStack).toHaveLength(100);
    expect(state.undoStack[0].bpm).toBe(101);
    expect(state.undoStack[99].bpm).toBe(200);
  });

  it("clears the redo branch when applying a new edit after undo", () => {
    useEditorStore.getState().openDocument(documentAt(120));
    useEditorStore.getState().applyEdit((document) => ({ ...document, bpm: 121 }));
    useEditorStore.getState().undo();
    useEditorStore.getState().applyEdit((document) => ({ ...document, bpm: 122 }));

    expect(useEditorStore.getState().redoStack).toEqual([]);
  });

  it("replaces non-Grid document fields without adding undo history", () => {
    const initial = documentAt(120);
    useEditorStore.getState().openDocument(initial);
    const replacement = {
      ...initial,
      bpm: 140,
      tracks: initial.tracks.map((track, index) => ({
        ...track,
        mute: index === 0,
        solo: index === 1,
      })),
    };

    useEditorStore.getState().replaceDocumentWithoutHistory(replacement);

    expect(useEditorStore.getState().document).toBe(replacement);
    expect(useEditorStore.getState().undoStack).toEqual([]);
    expect(useEditorStore.getState().redoStack).toEqual([]);
  });

  it("preserves non-Grid settings while undoing and redoing Grid history", () => {
    const initial = documentAt(120);
    useEditorStore.getState().openDocument(initial);
    useEditorStore.getState().applyEdit((document) => ({
      ...document,
      notes: [
        {
          id: "note-1",
          trackId: "kick",
          tick: 0,
          durationTicks: 120,
          velocity: 0.8,
          articulation: "normal",
        },
      ],
    }));

    const withSettings = {
      ...useEditorStore.getState().document!,
      bpm: 140,
      tracks: initial.tracks.map((track, index) => ({
        ...track,
        mute: index === 0,
        solo: index === 1,
      })),
    };
    useEditorStore.getState().replaceDocumentWithoutHistory(withSettings);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document).toMatchObject({
      bpm: 140,
      tracks: withSettings.tracks,
      notes: [],
    });

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().document).toMatchObject({
      bpm: 140,
      tracks: withSettings.tracks,
      notes: withSettings.notes,
    });
  });

  it("tracks saving, saved, and error states", () => {
    useEditorStore.getState().setSaveStatus("error", "保存失败");
    expect(useEditorStore.getState()).toMatchObject({
      saveStatus: "error",
      saveError: "保存失败",
    });

    useEditorStore.getState().setSaveStatus("saved");
    expect(useEditorStore.getState()).toMatchObject({
      saveStatus: "saved",
      saveError: undefined,
    });
  });
});
