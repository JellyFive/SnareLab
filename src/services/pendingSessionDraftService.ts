import type { SnareLabDatabase } from "../database/dexie";
import type { PendingSessionDraft } from "../types";

const legacyKey = "snarelab.pending-session-draft";

export async function savePendingSessionDraft(
  database: SnareLabDatabase,
  draft: PendingSessionDraft,
): Promise<void> {
  await database.transaction("rw", database.pendingDrafts, async () => {
    await database.pendingDrafts.clear();
    await database.pendingDrafts.add(normalizeDraft(draft));
  });
}

export async function getPendingSessionDraft(
  database: SnareLabDatabase,
): Promise<PendingSessionDraft | undefined> {
  const storedDraft = await database.pendingDrafts.orderBy("createdAt").last();
  if (storedDraft) return normalizeDraft(storedDraft);

  const legacyDraft = readLegacyDraft();
  if (!legacyDraft) return undefined;

  await savePendingSessionDraft(database, legacyDraft);
  removeLegacyDraft();
  return legacyDraft;
}

export async function clearPendingSessionDraft(database: SnareLabDatabase): Promise<void> {
  await database.pendingDrafts.clear();
  removeLegacyDraft();
}

function normalizeDraft(draft: PendingSessionDraft): PendingSessionDraft {
  return {
    ...draft,
    startTime: new Date(draft.startTime),
    endTime: new Date(draft.endTime),
    createdAt: new Date(draft.createdAt),
    attachments: draft.attachments ?? [],
    tagIds: draft.tagIds ?? [],
  };
}

function readLegacyDraft(): PendingSessionDraft | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(legacyKey);
    if (!raw) return undefined;
    return normalizeDraft(JSON.parse(raw) as PendingSessionDraft);
  } catch {
    return undefined;
  }
}

function removeLegacyDraft(): void {
  try {
    globalThis.localStorage?.removeItem(legacyKey);
  } catch {
    // Private browsing can deny local storage. The IndexedDB draft is already cleared.
  }
}
