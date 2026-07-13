import { create } from "zustand";

import type { RhythmDocument } from "../types";

const MAX_HISTORY_LENGTH = 100;

function preserveNonGridFields(
  snapshot: RhythmDocument,
  source: RhythmDocument,
): RhythmDocument {
  return {
    ...snapshot,
    name: source.name,
    bpm: source.bpm,
    tracks: source.tracks,
    updatedAt: source.updatedAt,
  };
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface EditorState {
  document?: RhythmDocument;
  undoStack: RhythmDocument[];
  redoStack: RhythmDocument[];
  saveStatus: SaveStatus;
  saveError?: string;
  openDocument: (document: RhythmDocument) => void;
  applyEdit: (edit: (document: RhythmDocument) => RhythmDocument) => void;
  replaceDocumentWithoutHistory: (document: RhythmDocument) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  setSaveStatus: (status: SaveStatus, error?: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  document: undefined,
  undoStack: [],
  redoStack: [],
  saveStatus: "idle",
  saveError: undefined,

  openDocument: (document) =>
    set({
      document,
      undoStack: [],
      redoStack: [],
      saveStatus: "idle",
      saveError: undefined,
    }),

  applyEdit: (edit) =>
    set((state) => {
      if (!state.document) return state;
      const next = edit(state.document);
      if (next === state.document) return state;
      return {
        document: next,
        undoStack: [...state.undoStack, state.document].slice(-MAX_HISTORY_LENGTH),
        redoStack: [],
        saveStatus: "idle",
        saveError: undefined,
      };
    }),

  replaceDocumentWithoutHistory: (document) =>
    set((state) => {
      if (state.document && state.document.id !== document.id) {
        return {
          document,
          undoStack: [],
          redoStack: [],
          saveStatus: "idle",
          saveError: undefined,
        };
      }
      return {
        document,
        undoStack: state.undoStack.map((snapshot) =>
          preserveNonGridFields(snapshot, document),
        ),
        redoStack: state.redoStack.map((snapshot) =>
          preserveNonGridFields(snapshot, document),
        ),
        saveStatus: "idle",
        saveError: undefined,
      };
    }),

  undo: () =>
    set((state) => {
      if (!state.document || state.undoStack.length === 0) return state;
      const previous = state.undoStack[state.undoStack.length - 1];
      return {
        document: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [state.document, ...state.redoStack].slice(0, MAX_HISTORY_LENGTH),
        saveStatus: "idle",
        saveError: undefined,
      };
    }),

  redo: () =>
    set((state) => {
      if (!state.document || state.redoStack.length === 0) return state;
      const [next, ...remainingRedo] = state.redoStack;
      return {
        document: next,
        undoStack: [...state.undoStack, state.document].slice(-MAX_HISTORY_LENGTH),
        redoStack: remainingRedo,
        saveStatus: "idle",
        saveError: undefined,
      };
    }),

  clearHistory: () => set({ undoStack: [], redoStack: [] }),

  setSaveStatus: (saveStatus, saveError) =>
    set({ saveStatus, saveError: saveStatus === "error" ? saveError : undefined }),
}));
