import type { RhythmTrackId } from "../../../types";

export interface SampleDefinition {
  label: string;
  url: string;
}

export const SAMPLE_MANIFEST: Record<RhythmTrackId, SampleDefinition> = {
  "hi-hat": {
    label: "Hi-Hat",
    url: `${import.meta.env.BASE_URL}audio/drum-kit/hi-hat.wav`,
  },
  snare: {
    label: "Snare",
    url: `${import.meta.env.BASE_URL}audio/drum-kit/snare.wav`,
  },
  kick: {
    label: "Kick",
    url: `${import.meta.env.BASE_URL}audio/drum-kit/kick.wav`,
  },
  "tom-1": {
    label: "Tom 1",
    url: `${import.meta.env.BASE_URL}audio/drum-kit/tom-1.wav`,
  },
  "tom-2": {
    label: "Tom 2",
    url: `${import.meta.env.BASE_URL}audio/drum-kit/tom-2.wav`,
  },
  "tom-3": {
    label: "Tom 3",
    url: `${import.meta.env.BASE_URL}audio/drum-kit/tom-3.wav`,
  },
  ride: {
    label: "Ride",
    url: `${import.meta.env.BASE_URL}audio/drum-kit/ride.wav`,
  },
  crash: {
    label: "Crash",
    url: `${import.meta.env.BASE_URL}audio/drum-kit/crash.wav`,
  },
};
