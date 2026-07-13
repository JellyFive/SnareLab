export const RHYTHM_TRACK_IDS = [
  "hi-hat",
  "snare",
  "kick",
  "tom-1",
  "tom-2",
  "tom-3",
  "ride",
  "crash",
] as const;

export type RhythmTrackId = (typeof RHYTHM_TRACK_IDS)[number];

export interface RhythmTrack {
  id: RhythmTrackId;
  mute: boolean;
  solo: boolean;
}

export interface RhythmNote {
  id: string;
  trackId: RhythmTrackId;
  tick: number;
  durationTicks: number;
  velocity: number;
  articulation: "normal" | "closed" | "open";
  tie?: "start" | "continue" | "stop";
  tuplet?: {
    actualNotes: number;
    normalNotes: number;
  };
}

export interface RhythmDocument {
  id: string;
  name: string;
  bpm: number;
  ppq: 480;
  timeSignature: {
    numerator: 4;
    denominator: 4;
  };
  subdivision: "sixteenth";
  measureCount: number;
  tracks: RhythmTrack[];
  notes: RhythmNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorPreferences {
  key: "editor";
  lastDocumentId?: string;
  updatedAt: Date;
}
