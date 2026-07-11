import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../database/seedDefaults";
import { CategoryRepository } from "./categoryRepository";
import { SessionRepository } from "./sessionRepository";
import { TagRepository } from "./tagRepository";

const databaseName = () => `snarelab-category-tag-test-${crypto.randomUUID()}`;

describe("CategoryRepository", () => {
  let database: SnareLabDatabase;
  let categories: CategoryRepository;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
    await ensureDefaultCategories(database);
    categories = new CategoryRepository(database);
  });

  afterEach(async () => database.delete());

  it("creates and edits a category", async () => {
    const category = await categories.createCategory({
      id: "warmup",
      name: "Warmup",
      icon: "flame",
      color: "#F59E0B",
    });

    await categories.updateCategory(category.id, {
      name: "Daily Warmup",
      icon: "sun",
      color: "#D69A00",
    });

    await expect(database.categories.get("warmup")).resolves.toMatchObject({
      name: "Daily Warmup",
      icon: "sun",
      color: "#D69A00",
    });
  });

  it("migrates linked sessions to Uncategorized before deleting a category", async () => {
    const category = await categories.createCategory({
      id: "warmup",
      name: "Warmup",
      icon: "flame",
      color: "#F59E0B",
    });
    const sessions = new SessionRepository(database);
    await sessions.saveSession({
      id: "session-1",
      startTime: new Date("2026-07-01T09:00:00.000Z"),
      endTime: new Date("2026-07-01T09:10:00.000Z"),
      duration: 600,
      categoryId: category.id,
    });

    await categories.deleteCategory(category.id);

    await expect(database.categories.get(category.id)).resolves.toBeUndefined();
    await expect(database.sessions.get("session-1")).resolves.toMatchObject({
      categoryId: "uncategorized",
    });
  });
});

describe("TagRepository", () => {
  let database: SnareLabDatabase;
  let tags: TagRepository;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
    await ensureDefaultCategories(database);
    await ensurePresetTags(database);
    tags = new TagRepository(database);
  });

  afterEach(async () => database.delete());

  it("creates and edits a tag", async () => {
    const tag = await tags.createTag({ id: "accent", name: "Accent" });

    await tags.updateTag(tag.id, { name: "Accents", color: "#5B63F6" });

    await expect(database.tags.get("accent")).resolves.toMatchObject({
      name: "Accents",
      color: "#5B63F6",
      isPreset: false,
    });
  });

  it("removes a deleted tag from every linked session", async () => {
    await tags.createTag({ id: "accent", name: "Accent" });
    const sessions = new SessionRepository(database);
    await sessions.saveSession({
      id: "session-1",
      startTime: new Date("2026-07-01T09:00:00.000Z"),
      endTime: new Date("2026-07-01T09:10:00.000Z"),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["accent", "timing"],
    });
    await sessions.saveSession({
      id: "session-2",
      startTime: new Date("2026-07-01T10:00:00.000Z"),
      endTime: new Date("2026-07-01T10:10:00.000Z"),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["accent"],
    });

    await tags.deleteTag("accent");

    await expect(database.tags.get("accent")).resolves.toBeUndefined();
    await expect(database.sessions.get("session-1")).resolves.toMatchObject({
      tagIds: ["timing"],
    });
    await expect(database.sessions.get("session-2")).resolves.toMatchObject({
      tagIds: [],
    });
  });
});
