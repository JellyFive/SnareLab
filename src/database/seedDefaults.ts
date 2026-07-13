import type { Category, Tag } from "../types";
import type { SnareLabDatabase } from "./dexie";

type CategoryDefinition = Omit<Category, "createdAt" | "updatedAt">;
type TagDefinition = Omit<Tag, "createdAt" | "updatedAt">;

export const DEFAULT_CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  {
    id: "fundamentals",
    name: "Fundamentals",
    icon: "drum",
    color: "#4C7FE8",
    isSystem: false,
  },
  {
    id: "coordination",
    name: "Coordination",
    icon: "combine",
    color: "#6B5BFF",
    isSystem: false,
  },
  {
    id: "song-practice",
    name: "Song Practice",
    icon: "music",
    color: "#F26F45",
    isSystem: false,
  },
  {
    id: "free-practice",
    name: "Free Practice",
    icon: "sparkles",
    color: "#D69A00",
    isSystem: false,
  },
  {
    id: "uncategorized",
    name: "Uncategorized",
    icon: "folder",
    color: "#7B8492",
    isSystem: true,
  },
];

export const PRESET_TAG_DEFINITIONS: readonly TagDefinition[] = [
  { id: "single-stroke", name: "Single Stroke", isPreset: true },
  { id: "double-stroke", name: "Double Stroke", isPreset: true },
  { id: "paradiddle", name: "Paradiddle", isPreset: true },
  { id: "rudiment", name: "Rudiment", isPreset: true },
  { id: "groove", name: "Groove", isPreset: true },
  { id: "fill", name: "Fill", isPreset: true },
  { id: "timing", name: "Timing", isPreset: true },
  { id: "dynamics", name: "Dynamics", isPreset: true },
  { id: "speed", name: "Speed", isPreset: true },
  { id: "control", name: "Control", isPreset: true },
  { id: "independence", name: "Independence", isPreset: true },
  { id: "reading", name: "Reading", isPreset: true },
  { id: "endurance", name: "Endurance", isPreset: true },
  { id: "accuracy", name: "Accuracy", isPreset: true },
];

export async function ensureDefaultCategories(
  database: SnareLabDatabase,
  now = new Date(),
): Promise<void> {
  await database.transaction("rw", database.categories, async () => {
    const existingIds = new Set(
      await database.categories.toCollection().primaryKeys(),
    );
    const missingCategories = DEFAULT_CATEGORY_DEFINITIONS.filter(
      (category) => !existingIds.has(category.id),
    ).map((category) => ({ ...category, createdAt: now, updatedAt: now }));

    if (missingCategories.length > 0) {
      await database.categories.bulkAdd(missingCategories);
    }
  });
}

export async function ensurePresetTags(
  database: SnareLabDatabase,
  now = new Date(),
): Promise<void> {
  await database.transaction("rw", database.tags, async () => {
    const existingIds = new Set(
      await database.tags.toCollection().primaryKeys(),
    );
    const missingTags = PRESET_TAG_DEFINITIONS.filter(
      (tag) => !existingIds.has(tag.id),
    ).map((tag) => ({ ...tag, createdAt: now, updatedAt: now }));

    if (missingTags.length > 0) {
      await database.tags.bulkAdd(missingTags);
    }
  });
}
