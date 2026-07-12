import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CategoryRepository, SystemCategoryDeletionError } from "../repositories/categoryRepository";
import type {
  Category,
  ImageAttachment,
  LogFilter,
  PendingSessionDraft,
  PracticeSession,
  Tag,
} from "../types";
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

  it("exposes the sessions, categories, tags, and pending drafts stores", () => {
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      "categories",
      "pendingDrafts",
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
