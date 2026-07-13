import { db, type SnareLabDatabase } from "../database/dexie";
import {
  MAX_BPM,
  MAX_MEASURES,
  MIN_BPM,
  MIN_MEASURES,
  PPQ,
  TICKS_PER_MEASURE,
} from "../features/editor/domain/rhythmConstants";
import {
  RHYTHM_TRACK_IDS,
  type EditorPreferences,
  type RhythmDocument,
} from "../types";

const EDITOR_PREFERENCES_KEY = "editor" as const;

export interface RhythmDocumentRepositoryOptions {
  now?: () => Date;
  createId?: () => string;
}

export class RhythmDocumentRepository {
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(
    private readonly database: SnareLabDatabase = db,
    options: RhythmDocumentRepositoryOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? (() => crypto.randomUUID());
  }

  async list(): Promise<RhythmDocument[]> {
    const documents = await this.database.rhythmDocuments.toArray();
    return documents
      .filter((document) => isValidRhythmDocument(document))
      .sort(
        (left, right) =>
          right.updatedAt.getTime() - left.updatedAt.getTime() ||
          left.id.localeCompare(right.id),
      );
  }

  async findById(id: string): Promise<RhythmDocument | undefined> {
    const document = await this.database.rhythmDocuments.get(id);
    return document && isValidRhythmDocument(document) ? document : undefined;
  }

  async create(name = "未命名节奏"): Promise<RhythmDocument> {
    const document = this.buildDefaultDocument(name);
    await this.database.rhythmDocuments.add(document);
    return document;
  }

  async save(document: RhythmDocument): Promise<RhythmDocument> {
    const saved = this.prepareForWrite(document);
    await this.database.rhythmDocuments.put(saved);
    return saved;
  }

  async rename(id: string, name: string): Promise<RhythmDocument> {
    const document = await this.findById(id);
    if (!document) {
      throw new Error(`Rhythm document does not exist: ${id}`);
    }
    return this.save({ ...document, name });
  }

  async delete(id: string): Promise<RhythmDocument> {
    return this.database.transaction(
      "rw",
      this.database.rhythmDocuments,
      this.database.editorPreferences,
      async () => {
        await this.database.rhythmDocuments.delete(id);
        const fallback = await this.findMostRecentValidDocument();
        const next = fallback ?? this.buildDefaultDocument();

        if (!fallback) {
          await this.database.rhythmDocuments.add(next);
        }
        await this.putLastDocumentPreference(next.id);
        return next;
      },
    );
  }

  async resolveInitialDocument(): Promise<RhythmDocument> {
    return this.database.transaction(
      "rw",
      this.database.rhythmDocuments,
      this.database.editorPreferences,
      async () => {
        const preferences = await this.database.editorPreferences.get(
          EDITOR_PREFERENCES_KEY,
        );
        const remembered = preferences?.lastDocumentId
          ? await this.findById(preferences.lastDocumentId)
          : undefined;
        const document = remembered ?? (await this.findMostRecentValidDocument());
        const resolved = document ?? this.buildDefaultDocument();

        if (!document) {
          await this.database.rhythmDocuments.add(resolved);
        }
        await this.putLastDocumentPreference(resolved.id);
        return resolved;
      },
    );
  }

  async rememberLastDocument(id: string): Promise<void> {
    const document = await this.findById(id);
    if (!document) {
      throw new Error(`Rhythm document does not exist: ${id}`);
    }
    await this.putLastDocumentPreference(id);
  }

  private buildDefaultDocument(name = "未命名节奏"): RhythmDocument {
    const trimmedName = assertName(name);
    const now = this.now();
    return {
      id: this.createId(),
      name: trimmedName,
      bpm: 120,
      ppq: PPQ,
      timeSignature: { numerator: 4, denominator: 4 },
      subdivision: "sixteenth",
      measureCount: MIN_MEASURES,
      tracks: RHYTHM_TRACK_IDS.map((id) => ({ id, mute: false, solo: false })),
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  private prepareForWrite(document: RhythmDocument): RhythmDocument {
    const prepared = {
      ...document,
      name: assertName(document.name),
      updatedAt: this.now(),
    };
    assertRhythmDocument(prepared);
    return prepared;
  }

  private async findMostRecentValidDocument(): Promise<RhythmDocument | undefined> {
    const documents = await this.database.rhythmDocuments.toArray();
    return documents
      .filter((document) => isValidRhythmDocument(document))
      .sort(
        (left, right) =>
          right.updatedAt.getTime() - left.updatedAt.getTime() ||
          left.id.localeCompare(right.id),
      )[0];
  }

  private async putLastDocumentPreference(lastDocumentId: string): Promise<void> {
    const preferences: EditorPreferences = {
      key: EDITOR_PREFERENCES_KEY,
      lastDocumentId,
      updatedAt: this.now(),
    };
    await this.database.editorPreferences.put(preferences);
  }
}

function assertName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new RangeError("Rhythm document name must not be empty.");
  return trimmed;
}

function isValidRhythmDocument(document: RhythmDocument): boolean {
  try {
    assertRhythmDocument(document);
    return true;
  } catch {
    return false;
  }
}

function assertRhythmDocument(document: RhythmDocument): void {
  assertName(document.name);
  if (typeof document.id !== "string" || !document.id.trim()) {
    throw new TypeError("Rhythm document id must be a non-empty string.");
  }
  if (!Number.isInteger(document.bpm) || document.bpm < MIN_BPM || document.bpm > MAX_BPM) {
    throw new RangeError(`Rhythm document BPM must be ${MIN_BPM}-${MAX_BPM}.`);
  }
  if (
    !Number.isInteger(document.measureCount) ||
    document.measureCount < MIN_MEASURES ||
    document.measureCount > MAX_MEASURES
  ) {
    throw new RangeError(
      `Rhythm document measure count must be ${MIN_MEASURES}-${MAX_MEASURES}.`,
    );
  }
  if (
    document.ppq !== PPQ ||
    document.timeSignature.numerator !== 4 ||
    document.timeSignature.denominator !== 4 ||
    document.subdivision !== "sixteenth"
  ) {
    throw new RangeError("Rhythm document timing format is not supported.");
  }
  if (
    !(document.createdAt instanceof Date) ||
    Number.isNaN(document.createdAt.getTime()) ||
    !(document.updatedAt instanceof Date) ||
    Number.isNaN(document.updatedAt.getTime())
  ) {
    throw new TypeError("Rhythm document dates must be valid Date values.");
  }
  if (
    document.tracks.length !== RHYTHM_TRACK_IDS.length ||
    !RHYTHM_TRACK_IDS.every(
      (id) => document.tracks.filter((track) => track.id === id).length === 1,
    ) ||
    document.tracks.some(
      (track) => typeof track.mute !== "boolean" || typeof track.solo !== "boolean",
    )
  ) {
    throw new RangeError("Rhythm document must contain the eight fixed tracks.");
  }

  const endTick = document.measureCount * TICKS_PER_MEASURE;
  const occupiedCells = new Set<string>();
  const noteIds = new Set<string>();
  for (const note of document.notes) {
    const cell = `${note.trackId}:${note.tick}`;
    if (
      typeof note.id !== "string" ||
      !note.id.trim() ||
      noteIds.has(note.id) ||
      !RHYTHM_TRACK_IDS.includes(note.trackId) ||
      !Number.isInteger(note.tick) ||
      note.tick < 0 ||
      note.tick >= endTick ||
      !Number.isInteger(note.durationTicks) ||
      note.durationTicks <= 0 ||
      !Number.isFinite(note.velocity) ||
      note.velocity < 0 ||
      note.velocity > 1 ||
      !["normal", "closed", "open"].includes(note.articulation) ||
      (note.tie !== undefined &&
        !["start", "continue", "stop"].includes(note.tie)) ||
      !isValidTuplet(note.tuplet) ||
      occupiedCells.has(cell)
    ) {
      throw new RangeError("Rhythm document contains an invalid or duplicate note.");
    }
    noteIds.add(note.id);
    occupiedCells.add(cell);
  }
}

function isValidTuplet(tuplet: RhythmDocument["notes"][number]["tuplet"]): boolean {
  if (tuplet === undefined) return true;
  return (
    typeof tuplet === "object" &&
    tuplet !== null &&
    Number.isInteger(tuplet.actualNotes) &&
    tuplet.actualNotes > 0 &&
    Number.isInteger(tuplet.normalNotes) &&
    tuplet.normalNotes > 0 &&
    tuplet.actualNotes !== tuplet.normalNotes
  );
}
