import { useCallback, useEffect, useRef } from "react";

import type { RhythmDocumentRepository } from "../../../repositories/rhythmDocumentRepository";
import { useEditorStore } from "../../../store/editorStore";
import type { RhythmDocument } from "../../../types";

let latestAutosaveRevision = 0;

export interface UseRhythmDocumentAutosaveOptions {
  document?: RhythmDocument;
  repository: Pick<RhythmDocumentRepository, "save">;
  delayMs?: number;
}

export interface RhythmDocumentAutosaveController {
  flush: () => Promise<void>;
  retry: () => Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "保存失败";
}

export function useRhythmDocumentAutosave({
  document,
  repository,
  delayMs = 300,
}: UseRhythmDocumentAutosaveOptions): RhythmDocumentAutosaveController {
  const latestDocumentRef = useRef(document);
  const repositoryRef = useRef(repository);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const revisionRef = useRef(0);
  const inFlightRef = useRef(new Map<number, Promise<void>>());

  latestDocumentRef.current = document;
  repositoryRef.current = repository;

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const persist = useCallback((target: RhythmDocument, revision: number) => {
    const existing = inFlightRef.current.get(revision);
    if (existing) return existing;

    if (
      revision === revisionRef.current &&
      revision === latestAutosaveRevision
    ) {
      useEditorStore.getState().setSaveStatus("saving");
    }

    const request = repositoryRef.current
      .save(target)
      .then(() => {
        if (
          revision === revisionRef.current &&
          revision === latestAutosaveRevision
        ) {
          useEditorStore.getState().setSaveStatus("saved");
        }
      })
      .catch((error: unknown) => {
        if (
          revision === revisionRef.current &&
          revision === latestAutosaveRevision
        ) {
          useEditorStore.getState().setSaveStatus("error", errorMessage(error));
        }
      })
      .finally(() => {
        inFlightRef.current.delete(revision);
      });

    inFlightRef.current.set(revision, request);
    return request;
  }, []);

  useEffect(() => {
    cancelTimer();
    const revision = ++latestAutosaveRevision;
    revisionRef.current = revision;
    if (!document) {
      return () => {
        if (revision === latestAutosaveRevision) latestAutosaveRevision += 1;
      };
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;
      void persist(document, revision);
    }, delayMs);

    return () => {
      cancelTimer();
      if (revision === latestAutosaveRevision) latestAutosaveRevision += 1;
    };
  }, [cancelTimer, delayMs, document, persist]);

  const flush = useCallback(async () => {
    cancelTimer();
    const target = latestDocumentRef.current;
    if (!target) return;
    await persist(target, revisionRef.current);
  }, [cancelTimer, persist]);

  const retry = useCallback(async () => {
    cancelTimer();
    const target = latestDocumentRef.current;
    if (!target) return;
    const revision = ++latestAutosaveRevision;
    revisionRef.current = revision;
    await persist(target, revision);
  }, [cancelTimer, persist]);

  return { flush, retry };
}
