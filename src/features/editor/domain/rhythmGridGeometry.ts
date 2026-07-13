import { MAX_MEASURES, MIN_MEASURES, STEPS_PER_MEASURE } from "./rhythmConstants";

export const GRID_STEP_WIDTH = 32;
export const GRID_ROW_HEIGHT = 44;
export const GRID_HEADER_HEIGHT = 36;
export const GRID_TRACK_COUNT = 8;

export interface GridGeometry {
  measureCount: number;
  stepCount: number;
  trackCount: number;
  stepWidth: number;
  rowHeight: number;
  headerHeight: number;
  beatWidth: number;
  measureWidth: number;
  width: number;
  height: number;
}

export interface GridPoint { x: number; y: number }
export interface GridCell { trackIndex: number; stepIndex: number }
export interface GridRect extends GridPoint { width: number; height: number }
export type GridCursorDirection = "left" | "right" | "up" | "down";

export function createGridGeometry(measureCount: number): GridGeometry {
  if (!Number.isInteger(measureCount) || measureCount < MIN_MEASURES || measureCount > MAX_MEASURES) {
    throw new RangeError(`measureCount must be ${MIN_MEASURES}-${MAX_MEASURES}.`);
  }
  const stepCount = measureCount * STEPS_PER_MEASURE;
  return {
    measureCount,
    stepCount,
    trackCount: GRID_TRACK_COUNT,
    stepWidth: GRID_STEP_WIDTH,
    rowHeight: GRID_ROW_HEIGHT,
    headerHeight: GRID_HEADER_HEIGHT,
    beatWidth: GRID_STEP_WIDTH * 4,
    measureWidth: GRID_STEP_WIDTH * STEPS_PER_MEASURE,
    width: stepCount * GRID_STEP_WIDTH,
    height: GRID_HEADER_HEIGHT + GRID_TRACK_COUNT * GRID_ROW_HEIGHT,
  };
}

export function hitTestGrid(geometry: GridGeometry, point: GridPoint): GridCell | undefined {
  if (point.x < 0 || point.x >= geometry.width || point.y < geometry.headerHeight || point.y >= geometry.height) {
    return undefined;
  }
  return {
    trackIndex: Math.floor((point.y - geometry.headerHeight) / geometry.rowHeight),
    stepIndex: Math.floor(point.x / geometry.stepWidth),
  };
}

export function cellToRect(geometry: GridGeometry, trackIndex: number, stepIndex: number): GridRect {
  if (!Number.isInteger(trackIndex) || trackIndex < 0 || trackIndex >= geometry.trackCount ||
      !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= geometry.stepCount) {
    throw new RangeError("Grid cell is outside the document.");
  }
  return {
    x: stepIndex * geometry.stepWidth,
    y: geometry.headerHeight + trackIndex * geometry.rowHeight,
    width: geometry.stepWidth,
    height: geometry.rowHeight,
  };
}

export function moveGridCursor(
  geometry: GridGeometry,
  cursor: GridCell,
  direction: GridCursorDirection,
): GridCell {
  const next = { ...cursor };
  if (direction === "left") next.stepIndex -= 1;
  if (direction === "right") next.stepIndex += 1;
  if (direction === "up") next.trackIndex -= 1;
  if (direction === "down") next.trackIndex += 1;
  return {
    trackIndex: Math.max(0, Math.min(geometry.trackCount - 1, next.trackIndex)),
    stepIndex: Math.max(0, Math.min(geometry.stepCount - 1, next.stepIndex)),
  };
}
