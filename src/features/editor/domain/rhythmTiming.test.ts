import { describe, expect, it } from "vitest";

import {
  documentEndTick,
  stepToTick,
  tickToSeconds,
} from "./rhythmTiming";

describe("rhythm timing", () => {
  it("maps sixteenth-note steps to absolute ticks", () => {
    expect(stepToTick(0, 0)).toBe(0);
    expect(stepToTick(1, 0)).toBe(1920);
    expect(stepToTick(1, 15)).toBe(3720);
  });

  it("converts ticks to seconds from the approved PPQ and BPM", () => {
    expect(tickToSeconds(0, 120)).toBe(0);
    expect(tickToSeconds(480, 120)).toBe(0.5);
    expect(tickToSeconds(960, 60)).toBe(2);
  });

  it("returns the exclusive end tick for a rhythm document", () => {
    expect(documentEndTick({ measureCount: 1 })).toBe(1920);
    expect(documentEndTick({ measureCount: 16 })).toBe(30720);
  });

  it.each([
    [-1, 0],
    [0.5, 0],
    [0, -1],
    [0, 16],
    [0, 1.5],
    [Number.POSITIVE_INFINITY, 0],
  ])("rejects invalid step coordinates (%s, %s)", (measureIndex, stepIndex) => {
    expect(() => stepToTick(measureIndex, stepIndex)).toThrow(RangeError);
  });

  it.each([
    [-1, 120],
    [0.5, 120],
    [480, 39],
    [480, 241],
    [480, Number.NaN],
  ])("rejects invalid tick or BPM input (%s, %s)", (tick, bpm) => {
    expect(() => tickToSeconds(tick, bpm)).toThrow(RangeError);
  });

  it.each([0, 17, 1.5, Number.NaN])(
    "rejects an invalid measure count (%s)",
    (measureCount) => {
      expect(() => documentEndTick({ measureCount })).toThrow(RangeError);
    },
  );
});
