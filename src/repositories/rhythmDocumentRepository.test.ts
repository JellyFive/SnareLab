import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../database/dexie";
import { createDefaultRhythmDocument } from "../features/editor/domain/rhythmCommands";
import { RhythmDocumentRepository } from "./rhythmDocumentRepository";

describe("RhythmDocumentRepository", () => {
  let database: SnareLabDatabase;
  let repository: RhythmDocumentRepository;
  let nowMs: number;
  let idSequence: number;

  beforeEach(() => {
    database = new SnareLabDatabase(`rhythm-documents-${crypto.randomUUID()}`);
    nowMs = new Date("2026-07-13T08:00:00.000Z").getTime();
    idSequence = 0;
    repository = new RhythmDocumentRepository(database, {
      now: () => new Date(nowMs),
      createId: () => `document-${++idSequence}`,
    });
  });

  afterEach(async () => database.delete());

  it("creates trimmed documents and lists them by updatedAt descending", async () => {
    const first = await repository.create("  第一段  ");
    nowMs += 1_000;
    const second = await repository.create("第二段");

    expect(first).toMatchObject({ id: "document-1", name: "第一段" });
    await expect(repository.list()).resolves.toEqual([second, first]);
    await expect(repository.create("   ")).rejects.toThrow(/name/i);
  });

  it("validates BPM, measure count, and the complete aggregate before saving", async () => {
    const document = createDefaultRhythmDocument("有效节奏");

    await expect(
      repository.save({ ...document, bpm: 39 }),
    ).rejects.toThrow(/bpm/i);
    await expect(
      repository.save({ ...document, measureCount: 17 }),
    ).rejects.toThrow(/measure/i);
    await expect(
      repository.save({ ...document, tracks: document.tracks.slice(0, 7) }),
    ).rejects.toThrow(/track/i);
    await expect(repository.findById(document.id)).resolves.toBeUndefined();
  });

  it("rejects invalid note ids, ties, and tuplet metadata", async () => {
    const document = createDefaultRhythmDocument("有效节奏");
    const validNote = {
      id: "note-1",
      trackId: "snare" as const,
      tick: 0,
      durationTicks: 120,
      velocity: 0.8,
      articulation: "normal" as const,
    };

    await expect(
      repository.save({
        ...document,
        notes: [validNote, { ...validNote, tick: 120 }],
      }),
    ).rejects.toThrow(/note/i);
    await expect(
      repository.save({
        ...document,
        notes: [{ ...validNote, id: "" }],
      }),
    ).rejects.toThrow(/note/i);
    await expect(
      repository.save({
        ...document,
        notes: [{ ...validNote, tie: "invalid" as "start" }],
      }),
    ).rejects.toThrow(/note/i);
    await expect(
      repository.save({
        ...document,
        notes: [
          {
            ...validNote,
            tuplet: { actualNotes: 3, normalNotes: 0 },
          },
        ],
      }),
    ).rejects.toThrow(/note/i);
  });

  it("rejects a runtime document id that is not a non-empty string", async () => {
    const document = createDefaultRhythmDocument("有效节奏");

    await expect(
      repository.save({
        ...document,
        id: 42 as unknown as string,
      }),
    ).rejects.toThrow(/id/i);
    await expect(
      repository.save({ ...document, id: "   " }),
    ).rejects.toThrow(/id/i);
  });

  it("saves and renames documents with trimmed names", async () => {
    const created = await repository.create("初稿");
    nowMs += 1_000;
    const saved = await repository.save({ ...created, bpm: 132 });
    nowMs += 1_000;
    const renamed = await repository.rename(created.id, "  主歌  ");

    expect(saved.bpm).toBe(132);
    expect(saved.updatedAt).toEqual(new Date("2026-07-13T08:00:01.000Z"));
    expect(renamed.name).toBe("主歌");
    await expect(repository.rename(created.id, " ")).rejects.toThrow(/name/i);
  });

  it("restores the remembered valid document and falls back to the most recent", async () => {
    const first = await repository.create("第一段");
    nowMs += 1_000;
    const second = await repository.create("第二段");

    await repository.rememberLastDocument(first.id);
    await expect(repository.resolveInitialDocument()).resolves.toEqual(first);

    await database.rhythmDocuments.delete(first.id);
    await expect(repository.resolveInitialDocument()).resolves.toEqual(second);
    await expect(database.editorPreferences.get("editor")).resolves.toMatchObject({
      lastDocumentId: second.id,
    });
  });

  it("deletes a document and atomically selects the newest fallback", async () => {
    const first = await repository.create("第一段");
    nowMs += 1_000;
    const second = await repository.create("第二段");
    await repository.rememberLastDocument(second.id);

    const fallback = await repository.delete(second.id);

    expect(fallback).toEqual(first);
    await expect(database.rhythmDocuments.get(second.id)).resolves.toBeUndefined();
    await expect(database.editorPreferences.get("editor")).resolves.toMatchObject({
      lastDocumentId: first.id,
    });
  });

  it("creates and remembers a default after deleting the final document", async () => {
    const only = await repository.create("唯一文档");

    const replacement = await repository.delete(only.id);

    expect(replacement).toMatchObject({
      id: "document-2",
      name: "未命名节奏",
      bpm: 120,
      measureCount: 1,
    });
    await expect(database.rhythmDocuments.toArray()).resolves.toEqual([replacement]);
    await expect(database.editorPreferences.get("editor")).resolves.toMatchObject({
      lastDocumentId: replacement.id,
    });
  });
});
