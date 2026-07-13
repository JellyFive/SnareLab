import { describe, expect, it } from "vitest";

import { RHYTHM_TRACK_IDS, type RhythmDocument, type RhythmTrack } from "../../../types";
import {
  appendMeasure,
  clearAllNotes,
  clearMeasure,
  createDefaultRhythmDocument,
  getAudibleTrackIds,
  removeMeasure,
  setDocumentBpm,
  setTrackMute,
  setTrackSolo,
  toggleNote,
} from "./rhythmCommands";

const now = new Date("2026-07-13T10:00:00.000Z");

function createDocument(): RhythmDocument {
  return createDefaultRhythmDocument("未命名节奏", now);
}

describe("rhythm edit commands", () => {
  it("creates the approved one-measure document with eight ordered tracks", () => {
    const document = createDocument();

    expect(document).toMatchObject({
      name: "未命名节奏",
      bpm: 120,
      ppq: 480,
      timeSignature: { numerator: 4, denominator: 4 },
      subdivision: "sixteenth",
      measureCount: 1,
      notes: [],
      createdAt: now,
      updatedAt: now,
    });
    expect(document.tracks).toEqual(
      RHYTHM_TRACK_IDS.map((id) => ({ id, mute: false, solo: false })),
    );
  });

  it("toggles a cell without mutating the source or creating duplicates", () => {
    const original = createDocument();
    const added = toggleNote("snare", 120)(original);
    const removed = toggleNote("snare", 120)(added);

    expect(original.notes).toEqual([]);
    expect(added).not.toBe(original);
    expect(added.notes).toHaveLength(1);
    expect(added.notes[0]).toMatchObject({
      trackId: "snare",
      tick: 120,
      durationTicks: 120,
      velocity: 0.8,
      articulation: "normal",
    });
    expect(removed.notes).toEqual([]);
  });

  it("rejects cells outside the document or off the current grid", () => {
    const document = createDocument();

    expect(() => toggleNote("snare", -120)(document)).toThrow(RangeError);
    expect(() => toggleNote("snare", 1)(document)).toThrow(RangeError);
    expect(() => toggleNote("snare", 1920)(document)).toThrow(RangeError);
  });

  it("appends measures through sixteen and returns the same object at the limit", () => {
    let document = createDocument();
    for (let count = 1; count < 16; count += 1) {
      const previous = document;
      document = appendMeasure(document);
      expect(document).not.toBe(previous);
    }

    expect(document.measureCount).toBe(16);
    expect(appendMeasure(document)).toBe(document);
  });

  it("does not remove the only remaining measure", () => {
    const document = createDocument();

    expect(removeMeasure(document, 0)).toBe(document);
  });

  it("removes notes in a deleted measure and shifts later notes left", () => {
    let document = appendMeasure(appendMeasure(createDocument()));
    document = toggleNote("kick", 0)(document);
    document = toggleNote("snare", 1920)(document);
    document = toggleNote("hi-hat", 2040)(document);
    document = toggleNote("crash", 3840)(document);
    const originalNotes = document.notes;

    const result = removeMeasure(document, 1);

    expect(result.measureCount).toBe(2);
    expect(result.notes.map(({ trackId, tick }) => ({ trackId, tick }))).toEqual([
      { trackId: "kick", tick: 0 },
      { trackId: "crash", tick: 1920 },
    ]);
    expect(document.notes).toBe(originalNotes);
    expect(document.notes).toHaveLength(4);
  });

  it("clears one measure without mutating notes outside it", () => {
    let document = appendMeasure(createDocument());
    document = toggleNote("kick", 0)(document);
    document = toggleNote("snare", 1920)(document);

    const result = clearMeasure(document, 0);

    expect(result.notes.map(({ trackId, tick }) => ({ trackId, tick }))).toEqual([
      { trackId: "snare", tick: 1920 },
    ]);
    expect(document.notes).toHaveLength(2);
  });

  it("returns the source when clearing an empty measure and clears all notes immutably", () => {
    const empty = createDocument();
    expect(clearMeasure(empty, 0)).toBe(empty);
    expect(clearAllNotes(empty)).toBe(empty);

    const populated = toggleNote("kick", 0)(empty);
    const cleared = clearAllNotes(populated);
    expect(cleared.notes).toEqual([]);
    expect(populated.notes).toHaveLength(1);
  });

  it("updates BPM and track mixer state without mutating the source", () => {
    const document = createDocument();
    const tempo = setDocumentBpm(document, 96);
    const muted = setTrackMute(tempo, "kick", true);
    const soloed = setTrackSolo(muted, "snare", true);

    expect(document.bpm).toBe(120);
    expect(tempo.bpm).toBe(96);
    expect(muted.tracks.find(({ id }) => id === "kick")?.mute).toBe(true);
    expect(soloed.tracks.find(({ id }) => id === "snare")?.solo).toBe(true);
    expect(document.tracks.every((track) => !track.mute && !track.solo)).toBe(true);
    expect(() => setDocumentBpm(document, 39)).toThrow(RangeError);
  });

  it("advances updatedAt only for successful state changes", () => {
    const document = createDocument();
    const noteAdded = toggleNote("kick", 0)(document);
    const measureAdded = appendMeasure(document);
    const tempoChanged = setDocumentBpm(document, 96);
    const trackChanged = setTrackMute(document, "kick", true);

    for (const changed of [noteAdded, measureAdded, tempoChanged, trackChanged]) {
      expect(changed.updatedAt.getTime()).toBeGreaterThan(document.updatedAt.getTime());
    }
    expect(setDocumentBpm(document, 120)).toBe(document);
    expect(setTrackMute(document, "kick", false)).toBe(document);
    expect(setTrackSolo(document, "snare", false)).toBe(document);
    expect(clearAllNotes(document)).toBe(document);
  });
});

describe("audible track selection", () => {
  const tracks = (overrides: Partial<Record<(typeof RHYTHM_TRACK_IDS)[number], Partial<RhythmTrack>>> = {}) =>
    RHYTHM_TRACK_IDS.map((id) => ({
      id,
      mute: overrides[id]?.mute ?? false,
      solo: overrides[id]?.solo ?? false,
    }));

  it("returns every unmuted track when there are no solo tracks", () => {
    expect([...getAudibleTrackIds(tracks({ kick: { mute: true } }))]).toEqual(
      RHYTHM_TRACK_IDS.filter((id) => id !== "kick"),
    );
  });

  it("returns only unmuted solo tracks while solo mode is active", () => {
    expect([
      ...getAudibleTrackIds(
        tracks({
          kick: { solo: true, mute: true },
          snare: { solo: true },
          ride: { solo: false },
        }),
      ),
    ]).toEqual(["snare"]);
  });

  it("returns no tracks when every solo track is muted", () => {
    expect([
      ...getAudibleTrackIds(tracks({ kick: { solo: true, mute: true } })),
    ]).toEqual([]);
  });
});
