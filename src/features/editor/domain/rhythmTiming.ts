import type { RhythmDocument } from "../../../types";
import {
  MAX_BPM,
  MAX_MEASURES,
  MIN_BPM,
  MIN_MEASURES,
  PPQ,
  STEPS_PER_MEASURE,
  TICKS_PER_MEASURE,
  TICKS_PER_STEP,
} from "./rhythmConstants";

function assertIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be an integer from ${minimum} to ${maximum}.`);
  }
}

export function stepToTick(measureIndex: number, stepIndex: number): number {
  assertIntegerInRange(measureIndex, 0, MAX_MEASURES - 1, "measureIndex");
  assertIntegerInRange(stepIndex, 0, STEPS_PER_MEASURE - 1, "stepIndex");
  return measureIndex * TICKS_PER_MEASURE + stepIndex * TICKS_PER_STEP;
}

export function tickToSeconds(tick: number, bpm: number): number {
  if (!Number.isInteger(tick) || tick < 0) {
    throw new RangeError("tick must be a non-negative integer.");
  }
  assertIntegerInRange(bpm, MIN_BPM, MAX_BPM, "bpm");
  return (tick / PPQ) * (60 / bpm);
}

export function documentEndTick(
  document: Pick<RhythmDocument, "measureCount">,
): number {
  assertIntegerInRange(
    document.measureCount,
    MIN_MEASURES,
    MAX_MEASURES,
    "measureCount",
  );
  return document.measureCount * TICKS_PER_MEASURE;
}
