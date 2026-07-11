import { beforeEach, describe, expect, it } from "vitest";

import { clearPendingSessionDraft, getPendingSessionDraft, savePendingSessionDraft } from "./pendingSessionDraftService";

describe("pendingSessionDraftService", () => {
  beforeEach(() => clearPendingSessionDraft());

  it("saves, restores, and clears a finished draft", () => {
    savePendingSessionDraft({ id: "draft-1", startTime: new Date("2026-07-01T09:00:00.000Z"), endTime: new Date("2026-07-01T09:01:00.000Z"), duration: 60, createdAt: new Date("2026-07-01T09:01:00.000Z") });
    expect(getPendingSessionDraft()).toMatchObject({ id: "draft-1", duration: 60 });
    clearPendingSessionDraft();
    expect(getPendingSessionDraft()).toBeUndefined();
  });
});
