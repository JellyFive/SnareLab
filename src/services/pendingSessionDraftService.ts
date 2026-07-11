import type { PendingSessionDraft } from "../types";

const key = "snarelab.pending-session-draft";
let fallbackValue: string | undefined;

function storage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export function savePendingSessionDraft(draft: PendingSessionDraft): void {
  const value = JSON.stringify(draft);
  const target = storage();
  if (target) target.setItem(key, value); else fallbackValue = value;
}

export function getPendingSessionDraft(): PendingSessionDraft | undefined {
  const target = storage();
  const value = target ? target.getItem(key) : fallbackValue;
  if (!value) return undefined;
  try {
    const draft = JSON.parse(value) as PendingSessionDraft;
    return { ...draft, startTime: new Date(draft.startTime), endTime: new Date(draft.endTime), createdAt: new Date(draft.createdAt) };
  } catch { return undefined; }
}

export function clearPendingSessionDraft(): void { const target = storage(); if (target) target.removeItem(key); fallbackValue = undefined; }
