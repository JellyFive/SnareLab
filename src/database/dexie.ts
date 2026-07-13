import Dexie, { type Table } from "dexie";

import type {
  Category,
  EditorPreferences,
  PendingSessionDraft,
  PracticeSession,
  RhythmDocument,
  Tag,
} from "../types";
import { migrateV1ToV2, migrateV2ToV3 } from "./migrations";

export class SnareLabDatabase extends Dexie {
  sessions!: Table<PracticeSession, string>;
  categories!: Table<Category, string>;
  tags!: Table<Tag, string>;
  pendingDrafts!: Table<PendingSessionDraft, string>;
  rhythmDocuments!: Table<RhythmDocument, string>;
  editorPreferences!: Table<EditorPreferences, string>;

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

    this.version(3)
      .stores({
        sessions:
          "id, createdAt, updatedAt, categoryId, startTime, endTime, duration, *tagIds",
        categories: "id, name, isSystem, updatedAt",
        tags: "id, name, isPreset, updatedAt",
      })
      .upgrade(migrateV2ToV3);

    this.version(4).stores({
      sessions:
        "id, createdAt, updatedAt, categoryId, startTime, endTime, duration, *tagIds",
      categories: "id, name, isSystem, updatedAt",
      tags: "id, name, isPreset, updatedAt",
      pendingDrafts: "id, createdAt",
    });

    this.version(5).stores({
      sessions:
        "id, createdAt, updatedAt, categoryId, startTime, endTime, duration, *tagIds",
      categories: "id, name, isSystem, updatedAt",
      tags: "id, name, isPreset, updatedAt",
      pendingDrafts: "id, createdAt",
      rhythmDocuments: "id, name, updatedAt",
      editorPreferences: "key, updatedAt",
    });
  }
}

export const db = new SnareLabDatabase();
