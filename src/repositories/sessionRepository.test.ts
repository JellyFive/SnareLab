import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SnareLabDatabase } from "../database/dexie";
import { ensureDefaultCategories } from "../database/seedDefaults";
import { SessionRepository } from "./sessionRepository";

const databaseName = () => `snarelab-session-test-${crypto.randomUUID()}`;

describe("SessionRepository", () => {
  let database: SnareLabDatabase;
  let sessions: SessionRepository;

  beforeEach(async () => {
    database = new SnareLabDatabase(databaseName());
    await database.open();
    await ensureDefaultCategories(database);
    sessions = new SessionRepository(database, {
      now: () => new Date("2026-07-05T12:00:00.000Z"),
    });
  });

  afterEach(async () => {
    await database.delete();
  });

  it("saves a session with timer facts and optional metadata", async () => {
    const startTime = new Date("2026-07-05T09:00:00.000Z");
    const endTime = new Date("2026-07-05T09:30:00.000Z");

    const saved = await sessions.saveSession({
      id: "session-1",
      startTime,
      endTime,
      duration: 1_800,
      categoryId: "fundamentals",
      tagIds: ["single-stroke"],
      note: "Keep strokes even.",
    });

    expect(saved).toMatchObject({
      id: "session-1",
      startTime,
      endTime,
      duration: 1_800,
      categoryId: "fundamentals",
      tagIds: ["single-stroke"],
      note: "Keep strokes even.",
    });
    await expect(sessions.findById("session-1")).resolves.toEqual(saved);
  });

  it("updates category, tags, and note without changing timer facts", async () => {
    const startTime = new Date("2026-07-05T09:00:00.000Z");
    const endTime = new Date("2026-07-05T09:30:00.000Z");
    await sessions.saveSession({
      id: "session-1",
      startTime,
      endTime,
      duration: 1_800,
      categoryId: "fundamentals",
    });

    await sessions.updateSessionMetadata(
      "session-1",
      {
        categoryId: "coordination",
        tagIds: ["independence"],
        note: "Slow the left foot.",
        duration: 90,
        startTime: new Date("2026-07-01T09:00:00.000Z"),
        endTime: new Date("2026-07-01T09:01:30.000Z"),
      } as never,
    );

    await expect(sessions.findById("session-1")).resolves.toMatchObject({
      categoryId: "coordination",
      tagIds: ["independence"],
      note: "Slow the left foot.",
      duration: 1_800,
      startTime,
      endTime,
    });
  });

  it("hard deletes a session by id", async () => {
    await sessions.saveSession({
      id: "session-1",
      startTime: new Date("2026-07-05T09:00:00.000Z"),
      endTime: new Date("2026-07-05T09:30:00.000Z"),
      duration: 1_800,
      categoryId: "fundamentals",
    });

    await sessions.deleteSession("session-1");

    await expect(sessions.findById("session-1")).resolves.toBeUndefined();
  });

  it("finds sessions by the selected start-time day", async () => {
    await sessions.saveSession({
      id: "july-1",
      startTime: new Date(2026, 6, 1, 23, 30),
      endTime: new Date(2026, 6, 2, 0, 15),
      duration: 2_700,
      categoryId: "fundamentals",
    });
    await sessions.saveSession({
      id: "july-2",
      startTime: new Date(2026, 6, 2, 8),
      endTime: new Date(2026, 6, 2, 8, 30),
      duration: 1_800,
      categoryId: "coordination",
    });

    await expect(
      sessions.findByDate(new Date(2026, 6, 1, 12)),
    ).resolves.toMatchObject([{ id: "july-1" }]);
    await expect(
      sessions.findByDateRange(
        new Date(2026, 6, 1, 12),
        new Date(2026, 6, 2, 12),
      ),
    ).resolves.toMatchObject([{ id: "july-1" }, { id: "july-2" }]);
  });

  it("returns only sessions matching every active filter", async () => {
    await sessions.saveSession({
      id: "match",
      startTime: new Date("2026-07-02T09:00:00.000Z"),
      endTime: new Date("2026-07-02T09:10:00.000Z"),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["timing", "control"],
    });
    await sessions.saveSession({
      id: "wrong-category",
      startTime: new Date("2026-07-02T09:00:00.000Z"),
      endTime: new Date("2026-07-02T09:10:00.000Z"),
      duration: 600,
      categoryId: "coordination",
      tagIds: ["timing"],
    });
    await sessions.saveSession({
      id: "wrong-tag",
      startTime: new Date("2026-07-02T09:00:00.000Z"),
      endTime: new Date("2026-07-02T09:10:00.000Z"),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["groove"],
    });
    await sessions.saveSession({
      id: "wrong-duration",
      startTime: new Date("2026-07-02T09:00:00.000Z"),
      endTime: new Date("2026-07-02T09:03:00.000Z"),
      duration: 180,
      categoryId: "fundamentals",
      tagIds: ["timing"],
    });
    await sessions.saveSession({
      id: "wrong-date",
      startTime: new Date("2026-07-03T09:00:00.000Z"),
      endTime: new Date("2026-07-03T09:10:00.000Z"),
      duration: 600,
      categoryId: "fundamentals",
      tagIds: ["timing"],
    });

    await expect(
      sessions.filterSessions({
        categoryIds: ["fundamentals"],
        tagIds: ["timing"],
        startDate: new Date("2026-07-02T12:00:00.000Z"),
        endDate: new Date("2026-07-02T12:00:00.000Z"),
        minDuration: 300,
        maxDuration: 900,
      }),
    ).resolves.toMatchObject([{ id: "match" }]);
  });
});
