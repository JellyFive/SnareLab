import Dexie, { type Table } from "dexie";

import type { Category, PracticeSession, Tag } from "../types";
import { migrateV1ToV2 } from "./migrations";

export class SnareLabDatabase extends Dexie {
  sessions!: Table<PracticeSession, string>;
  categories!: Table<Category, string>;
  tags!: Table<Tag, string>;

  constructor(name = "snarelab-practice-log") {
    super(name);

    this.version(1).stores({
      sessions: "id, createdAt, categoryId, startTime, endTime, duration",
      categories: "id, name",
    });

    this.version(2)
      .stores({
        sessions:
          "id, createdAt, updatedAt, categoryId, startTime, endTime, duration, *tagIds",
        categories: "id, name, isSystem, updatedAt",
        tags: "id, name, isPreset, updatedAt",
      })
      .upgrade(migrateV1ToV2);
  }
}

export const db = new SnareLabDatabase();
