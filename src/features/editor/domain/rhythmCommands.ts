import {
  RHYTHM_TRACK_IDS,
  type RhythmDocument,
  type RhythmTrack,
  type RhythmTrackId,
} from "../../../types";
import {
  MAX_BPM,
  MAX_MEASURES,
  MIN_BPM,
  MIN_MEASURES,
  PPQ,
  TICKS_PER_MEASURE,
  TICKS_PER_STEP,
} from "./rhythmConstants";
import { documentEndTick } from "./rhythmTiming";

export type RhythmEdit = (document: RhythmDocument) => RhythmDocument;

function nextUpdatedAt(document: RhythmDocument): Date {
  return new Date(Math.max(Date.now(), document.updatedAt.getTime() + 1));
}

function assertMeasureIndex(document: RhythmDocument, measureIndex: number): void {
  if (
    !Number.isInteger(measureIndex) ||
    measureIndex < 0 ||
    measureIndex >= document.measureCount
  ) {
    throw new RangeError("measureIndex must identify a measure in the document.");
  }
}

function updateTrack(
  document: RhythmDocument,
  trackId: RhythmTrackId,
  update: (track: RhythmTrack) => RhythmTrack,
): RhythmDocument {
  const trackIndex = document.tracks.findIndex((track) => track.id === trackId);
  if (trackIndex < 0) {
    throw new RangeError(`Track ${trackId} does not exist in the document.`);
  }

  const nextTrack = update(document.tracks[trackIndex]);
  if (nextTrack === document.tracks[trackIndex]) return document;

  const tracks = [...document.tracks];
  tracks[trackIndex] = nextTrack;
  return { ...document, tracks, updatedAt: nextUpdatedAt(document) };
}

export function createDefaultRhythmDocument(
  name = "未命名节奏",
  now = new Date(),
): RhythmDocument {
  return {
    id: crypto.randomUUID(),
    name,
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

export function toggleNote(trackId: RhythmTrackId, tick: number): RhythmEdit {
  return (document) => {
    if (!document.tracks.some((track) => track.id === trackId)) {
      throw new RangeError(`Track ${trackId} does not exist in the document.`);
    }
    if (
      !Number.isInteger(tick) ||
      tick < 0 ||
      tick >= documentEndTick(document) ||
      tick % TICKS_PER_STEP !== 0
    ) {
      throw new RangeError("tick must identify a sixteenth-note cell in the document.");
    }

    const existingIndex = document.notes.findIndex(
      (note) => note.trackId === trackId && note.tick === tick,
    );
    const notes =
      existingIndex >= 0
        ? document.notes.filter((_, index) => index !== existingIndex)
        : [
            ...document.notes,
            {
              id: crypto.randomUUID(),
              trackId,
              tick,
              durationTicks: TICKS_PER_STEP,
              velocity: 0.8,
              articulation: "normal" as const,
            },
          ];

    return { ...document, notes, updatedAt: nextUpdatedAt(document) };
  };
}

export function appendMeasure(document: RhythmDocument): RhythmDocument {
  if (document.measureCount >= MAX_MEASURES) return document;
  return {
    ...document,
    measureCount: document.measureCount + 1,
    updatedAt: nextUpdatedAt(document),
  };
}

export function removeMeasure(
  document: RhythmDocument,
  measureIndex: number,
): RhythmDocument {
  assertMeasureIndex(document, measureIndex);
  if (document.measureCount <= MIN_MEASURES) return document;

  const startTick = measureIndex * TICKS_PER_MEASURE;
  const endTick = startTick + TICKS_PER_MEASURE;
  const notes = document.notes.flatMap((note) => {
    if (note.tick >= startTick && note.tick < endTick) return [];
    if (note.tick >= endTick) {
      return [{ ...note, tick: note.tick - TICKS_PER_MEASURE }];
    }
    return [note];
  });

  return {
    ...document,
    measureCount: document.measureCount - 1,
    notes,
    updatedAt: nextUpdatedAt(document),
  };
}

export function clearMeasure(
  document: RhythmDocument,
  measureIndex: number,
): RhythmDocument {
  assertMeasureIndex(document, measureIndex);
  const startTick = measureIndex * TICKS_PER_MEASURE;
  const endTick = startTick + TICKS_PER_MEASURE;
  const notes = document.notes.filter(
    (note) => note.tick < startTick || note.tick >= endTick,
  );
  if (notes.length === document.notes.length) return document;
  return { ...document, notes, updatedAt: nextUpdatedAt(document) };
}

export function clearAllNotes(document: RhythmDocument): RhythmDocument {
  if (document.notes.length === 0) return document;
  return { ...document, notes: [], updatedAt: nextUpdatedAt(document) };
}

export function setTrackMute(
  document: RhythmDocument,
  trackId: RhythmTrackId,
  mute: boolean,
): RhythmDocument {
  return updateTrack(document, trackId, (track) =>
    track.mute === mute ? track : { ...track, mute },
  );
}

export function setTrackSolo(
  document: RhythmDocument,
  trackId: RhythmTrackId,
  solo: boolean,
): RhythmDocument {
  return updateTrack(document, trackId, (track) =>
    track.solo === solo ? track : { ...track, solo },
  );
}

export function setDocumentBpm(
  document: RhythmDocument,
  bpm: number,
): RhythmDocument {
  if (!Number.isInteger(bpm) || bpm < MIN_BPM || bpm > MAX_BPM) {
    throw new RangeError(`bpm must be an integer from ${MIN_BPM} to ${MAX_BPM}.`);
  }
  if (document.bpm === bpm) return document;
  return { ...document, bpm, updatedAt: nextUpdatedAt(document) };
}

export function getAudibleTrackIds(tracks: RhythmTrack[]): Set<RhythmTrackId> {
  const hasSolo = tracks.some((track) => track.solo);
  const audible = tracks.filter((track) =>
    hasSolo ? track.solo && !track.mute : !track.mute,
  );
  return new Set(audible.map((track) => track.id));
}
