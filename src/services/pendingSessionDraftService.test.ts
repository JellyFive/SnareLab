import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../database/dexie";
import { clearPendingSessionDraft, getPendingSessionDraft, savePendingSessionDraft } from "./pendingSessionDraftService";

describe("pendingSessionDraftService", () => {
  let database: SnareLabDatabase;

  beforeEach(async () => {
    database = new SnareLabDatabase(`pending-draft-${crypto.randomUUID()}`);
    await database.open();
  });

  afterEach(async () => {
    await database.delete();
  });

  it("saves, restores, and clears a finished draft with its image attachments", async () => {
    const image = new Blob(["practice image"], { type: "image/jpeg" });
    await savePendingSessionDraft(database, {
      id: "draft-1",
      startTime: new Date("2026-07-01T09:00:00.000Z"),
      endTime: new Date("2026-07-01T09:01:00.000Z"),
      duration: 60,
      categoryId: "fundamentals",
      tagIds: ["single-stroke"],
      note: "保持放松",
      attachments: [{ id: "image-1", blob: image, mimeType: "image/jpeg", fileName: "practice.jpg", size: image.size, createdAt: new Date("2026-07-01T09:01:00.000Z"), sortOrder: 0 }],
      createdAt: new Date("2026-07-01T09:01:00.000Z"),
    });

    await expect(getPendingSessionDraft(database)).resolves.toMatchObject({
      id: "draft-1",
      duration: 60,
      categoryId: "fundamentals",
      tagIds: ["single-stroke"],
      note: "保持放松",
      attachments: [expect.objectContaining({ fileName: "practice.jpg", size: image.size })],
    });

    await clearPendingSessionDraft(database);
    await expect(getPendingSessionDraft(database)).resolves.toBeUndefined();
  });
});
