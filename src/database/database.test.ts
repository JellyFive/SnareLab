import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CategoryRepository, SystemCategoryDeletionError } from "../repositories/categoryRepository";
import type {
  Category,
  EditorPreferences,
  ImageAttachment,
  LogFilter,
  PendingSessionDraft,
  PracticeSession,
  RhythmDocument,
  Tag,
} from "../types";
import { RHYTHM_TRACK_IDS } from "../types";
import { SnareLabDatabase } from "./dexie";
import {
  DEFAULT_CATEGORY_DEFINITIONS,
  PRESET_TAG_DEFINITIONS,
  ensureDefaultCategories,
  ensurePresetTags,
} from "./seedDefaults";

const databaseName = () => `snarelab-task-3-${crypto.randomUUID()}`;

describe("SnareLab database", () => {
  let database: SnareLabDatabase;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
  });

  afterEach(async () => {
    await database.delete();
  });

  it("exposes the practice log and rhythm editor stores", () => {
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      "categories",
      "editorPreferences",
      "pendingDrafts",
      "rhythmDocuments",
      "sessions",
      "tags",
    ]);
  });

  it("seeds the five default categories without duplicates", async () => {
    await ensureDefaultCategories(database);
    await ensureDefaultCategories(database);

    const categories = await database.categories.orderBy("name").toArray();

    expect(categories.map((category) => category.name)).toEqual(
      DEFAULT_CATEGORY_DEFINITIONS.map((category) => category.name).sort(),
    );
    expect(categories).toHaveLength(5);
    expect(await database.categories.get("uncategorized")).toMatchObject({
      isSystem: true,
      name: "Uncategorized",
    });
  });

  it("seeds each preset tag once", async () => {
    await ensurePresetTags(database);
    await ensurePresetTags(database);

    const tags = await database.tags.orderBy("name").toArray();

    expect(tags.map((tag) => tag.name)).toEqual(
      PRESET_TAG_DEFINITIONS.map((tag) => tag.name).sort(),
    );
    expect(tags).toHaveLength(PRESET_TAG_DEFINITIONS.length);
  });

  it("does not recreate a preset tag after it has been renamed", async () => {
    await ensurePresetTags(database);
    await database.tags.update("control", { name: "稳定性" });

    await ensurePresetTags(database);

    expect(await database.tags.get("control")).toMatchObject({ name: "稳定性" });
    expect(await database.tags.where("name").equals("Control").count()).toBe(0);
    expect(await database.tags.count()).toBe(PRESET_TAG_DEFINITIONS.length);
  });

  it("rejects deletion of the Uncategorized system category", async () => {
    await ensureDefaultCategories(database);
    const categories = new CategoryRepository(database);

    await expect(categories.deleteCategory("uncategorized")).rejects.toBeInstanceOf(
      SystemCategoryDeletionError,
    );
    await expect(database.categories.get("uncategorized")).resolves.toMatchObject({
      isSystem: true,
    });
  });

  it("migrates v1 session and category records to v2 fields", async () => {
    const legacyName = databaseName();
    const legacy = new Dexie(legacyName);
    const createdAt = new Date("2026-07-01T10:00:00.000Z");

    legacy.version(1).stores({
      sessions: "id, createdAt, categoryId, startTime, endTime, duration",
      categories: "id, name",
    });
    await legacy.open();
    await legacy.table("sessions").add({
      id: "session-1",
      startTime: createdAt,
      endTime: createdAt,
      duration: 60,
      categoryId: "fundamentals",
      createdAt,
    });
    await legacy.table("categories").add({
      id: "fundamentals",
      name: "Fundamentals",
      icon: "drum",
      color: "#DDEBFF",
      createdAt,
    });
    legacy.close();

    const migrated = new SnareLabDatabase(legacyName);
    await migrated.open();

    await expect(migrated.sessions.get("session-1")).resolves.toMatchObject({
      tagIds: [],
      updatedAt: createdAt,
    });
    await expect(migrated.categories.get("fundamentals")).resolves.toMatchObject({
      isSystem: false,
      updatedAt: createdAt,
    });

    await migrated.delete();
  });

  it("migrates v2 records to v3 attachments without changing existing metadata", async () => {
    const legacyName = databaseName();
    const legacy = new Dexie(legacyName);
    const createdAt = new Date("2026-07-01T10:00:00.000Z");

    legacy.version(2).stores({
      sessions:
        "id, createdAt, updatedAt, categoryId, startTime, endTime, duration, *tagIds",
      categories: "id, name, isSystem, updatedAt",
      tags: "id, name, isPreset, updatedAt",
    });
    await legacy.open();
    await legacy.table("sessions").add({
      id: "session-v2",
      startTime: createdAt,
      endTime: new Date("2026-07-01T10:10:00.000Z"),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["control"],
      note: "Keep the rebound relaxed.",
      createdAt,
      updatedAt: createdAt,
    });
    legacy.close();

    const migrated = new SnareLabDatabase(legacyName);
    await migrated.open();

    await expect(migrated.sessions.get("session-v2")).resolves.toMatchObject({
      id: "session-v2",
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["control"],
      note: "Keep the rebound relaxed.",
      attachments: [],
    });

    migrated.close();
    await migrated.open();
    await expect(migrated.sessions.get("session-v2")).resolves.toMatchObject({
      attachments: [],
      note: "Keep the rebound relaxed.",
    });

    await migrated.delete();
  });

  it("adds empty rhythm stores to a v4 database without changing practice data", async () => {
    const legacyName = databaseName();
    const legacy = new Dexie(legacyName);
    const createdAt = new Date("2026-07-13T10:00:00.000Z");
    const attachment: ImageAttachment = {
      id: "image-v4",
      blob: new Blob(["practice image"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
      fileName: "practice.jpg",
      size: 14,
      createdAt,
      sortOrder: 0,
    };
    const legacyCategory: Category = {
      id: "fundamentals",
      name: "Fundamentals",
      icon: "drum",
      color: "#DDEBFF",
      isSystem: false,
      createdAt,
      updatedAt: createdAt,
    };
    const legacyTag: Tag = {
      id: "control",
      name: "Control",
      isPreset: true,
      createdAt,
      updatedAt: createdAt,
    };
    const legacySession: PracticeSession = {
      id: "session-v4",
      startTime: createdAt,
      endTime: new Date("2026-07-13T10:10:00.000Z"),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["control"],
      attachments: [attachment],
      note: "Keep the groove relaxed.",
      createdAt,
      updatedAt: createdAt,
    };
    const legacyDraft: PendingSessionDraft = {
      id: "pending-session",
      startTime: createdAt,
      endTime: new Date("2026-07-13T10:05:00.000Z"),
      duration: 300,
      attachments: [attachment],
      createdAt,
    };

    legacy.version(4).stores({
      sessions:
        "id, createdAt, updatedAt, categoryId, startTime, endTime, duration, *tagIds",
      categories: "id, name, isSystem, updatedAt",
      tags: "id, name, isPreset, updatedAt",
      pendingDrafts: "id, createdAt",
    });
    await legacy.open();
    await legacy.table("categories").add(legacyCategory);
    await legacy.table("tags").add(legacyTag);
    await legacy.table("sessions").add(legacySession);
    await legacy.table("pendingDrafts").add(legacyDraft);
    legacy.close();

    const migrated = new SnareLabDatabase(legacyName);
    await migrated.open();

    await expect(migrated.categories.get("fundamentals")).resolves.toEqual(legacyCategory);
    await expect(migrated.tags.get("control")).resolves.toEqual(legacyTag);
    const migratedSession = await migrated.sessions.get("session-v4");
    const migratedDraft = await migrated.pendingDrafts.get("pending-session");
    const attachmentMetadata = (value: ImageAttachment) => ({
      id: value.id,
      mimeType: value.mimeType,
      fileName: value.fileName,
      size: value.size,
      createdAt: value.createdAt,
      sortOrder: value.sortOrder,
    });

    expect(migratedSession).toEqual({
      ...legacySession,
      attachments: migratedSession?.attachments,
    });
    expect(migratedSession?.attachments.map(attachmentMetadata)).toEqual(
      legacySession.attachments.map(attachmentMetadata),
    );
    expect(migratedSession?.attachments[0]).toHaveProperty("blob");
    expect(migratedDraft).toEqual({
      ...legacyDraft,
      attachments: migratedDraft?.attachments,
    });
    expect(migratedDraft?.attachments.map(attachmentMetadata)).toEqual(
      legacyDraft.attachments.map(attachmentMetadata),
    );
    expect(migratedDraft?.attachments[0]).toHaveProperty("blob");
    await expect(migrated.rhythmDocuments.count()).resolves.toBe(0);
    await expect(migrated.editorPreferences.count()).resolves.toBe(0);
    expect(migrated.rhythmDocuments.schema.primKey.name).toBe("id");
    expect(migrated.rhythmDocuments.schema.indexes.map((index) => index.name)).toEqual([
      "name",
      "updatedAt",
    ]);
    expect(migrated.editorPreferences.schema.primKey.name).toBe("key");
    expect(migrated.editorPreferences.schema.indexes.map((index) => index.name)).toEqual([
      "updatedAt",
    ]);

    await migrated.delete();
  });

  it("round-trips rhythm documents and editor preferences", async () => {
    const now = new Date("2026-07-13T10:00:00.000Z");
    const document: RhythmDocument = {
      id: "rhythm-round-trip",
      name: "基础律动",
      bpm: 120,
      ppq: 480,
      timeSignature: { numerator: 4, denominator: 4 },
      subdivision: "sixteenth",
      measureCount: 1,
      tracks: RHYTHM_TRACK_IDS.map((id) => ({ id, mute: false, solo: false })),
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
    const preferences: EditorPreferences = {
      key: "editor",
      lastDocumentId: document.id,
      updatedAt: now,
    };

    await database.rhythmDocuments.add(document);
    await database.editorPreferences.add(preferences);

    await expect(database.rhythmDocuments.get(document.id)).resolves.toEqual(document);
    await expect(database.editorPreferences.get("editor")).resolves.toEqual(preferences);
    await expect(database.rhythmDocuments.where("name").equals("基础律动").first()).resolves.toEqual(document);
    await expect(database.rhythmDocuments.orderBy("updatedAt").first()).resolves.toEqual(document);
  });
});

describe("Task 3 domain types", () => {
  it("supports the approved practice-log domain shapes", () => {
    const now = new Date("2026-07-01T10:00:00.000Z");
    const attachment: ImageAttachment = {
      id: "image-1",
      blob: new Blob(["practice image"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
      fileName: "practice.jpg",
      size: 14,
      createdAt: now,
      sortOrder: 0,
    };
    const category: Category = {
      id: "fundamentals",
      name: "Fundamentals",
      icon: "drum",
      color: "#DDEBFF",
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };
    const tag: Tag = {
      id: "single-stroke",
      name: "Single Stroke",
      isPreset: true,
      createdAt: now,
      updatedAt: now,
    };
    const session: PracticeSession = {
      id: "session-1",
      startTime: now,
      endTime: now,
      duration: 60,
      categoryId: category.id,
      tagIds: [tag.id],
      attachments: [attachment],
      createdAt: now,
      updatedAt: now,
    };
    const draft: PendingSessionDraft = {
      id: "draft-1",
      startTime: now,
      endTime: now,
      duration: 60,
      attachments: [attachment],
      createdAt: now,
    };
    const filter: LogFilter = {
      categoryIds: [category.id],
      tagIds: [tag.id],
      startDate: now,
      endDate: now,
      minDuration: 30,
      maxDuration: 90,
    };

    expect({ session, draft, filter }).toEqual(
      expect.objectContaining({
        session: expect.objectContaining({ categoryId: "fundamentals" }),
        draft: expect.objectContaining({ attachments: [attachment] }),
        filter: expect.objectContaining({ maxDuration: 90 }),
      }),
    );
  });
});

describe("V0.4 rhythm editor domain types", () => {
  it("supports the approved extensible rhythm document shape", () => {
    const now = new Date("2026-07-13T10:00:00.000Z");
    const document: RhythmDocument = {
      id: "rhythm-1",
      name: "未命名节奏",
      bpm: 120,
      ppq: 480,
      timeSignature: { numerator: 4, denominator: 4 },
      subdivision: "sixteenth",
      measureCount: 1,
      tracks: RHYTHM_TRACK_IDS.map((id) => ({ id, mute: false, solo: false })),
      notes: [
        {
          id: "note-1",
          trackId: "hi-hat",
          tick: 0,
          durationTicks: 120,
          velocity: 0.8,
          articulation: "closed",
          tie: "start",
          tuplet: { actualNotes: 3, normalNotes: 2 },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    const preferences: EditorPreferences = {
      key: "editor",
      lastDocumentId: document.id,
      updatedAt: now,
    };

    expect(document.tracks.map((track) => track.id)).toEqual(RHYTHM_TRACK_IDS);
    expect(document.notes[0]).toMatchObject({
      articulation: "closed",
      tie: "start",
      tuplet: { actualNotes: 3, normalNotes: 2 },
    });
    expect(preferences.lastDocumentId).toBe(document.id);
  });
});
