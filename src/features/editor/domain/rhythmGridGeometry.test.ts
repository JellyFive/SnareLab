import { describe, expect, it } from "vitest";

import {
  cellToRect,
  createGridGeometry,
  hitTestGrid,
  moveGridCursor,
} from "./rhythmGridGeometry";

describe("rhythmGridGeometry", () => {
  it("creates fixed CSS-pixel dimensions through sixteen measures", () => {
    expect(createGridGeometry(1)).toMatchObject({
      stepWidth: 32,
      rowHeight: 44,
      headerHeight: 36,
      stepCount: 16,
      width: 512,
      height: 388,
      beatWidth: 128,
      measureWidth: 512,
    });
    expect(createGridGeometry(16).width).toBe(8192);
  });

  it("hit-tests exact cells and rejects headers and outside coordinates", () => {
    const geometry = createGridGeometry(1);
    expect(hitTestGrid(geometry, { x: 33, y: 37 })).toEqual({
      trackIndex: 0,
      stepIndex: 1,
    });
    expect(hitTestGrid(geometry, { x: 0, y: 36 })).toEqual({
      trackIndex: 0,
      stepIndex: 0,
    });
    expect(hitTestGrid(geometry, { x: -1, y: 20 })).toBeUndefined();
    expect(hitTestGrid(geometry, { x: 20, y: 35 })).toBeUndefined();
    expect(hitTestGrid(geometry, { x: 512, y: 36 })).toBeUndefined();
    expect(hitTestGrid(geometry, { x: 0, y: 388 })).toBeUndefined();
  });

  it("returns CSS-pixel cell rectangles", () => {
    expect(cellToRect(createGridGeometry(2), 3, 17)).toEqual({
      x: 544,
      y: 168,
      width: 32,
      height: 44,
    });
  });

  it("moves and clamps the keyboard cursor", () => {
    const geometry = createGridGeometry(1);
    expect(moveGridCursor(geometry, { trackIndex: 0, stepIndex: 0 }, "left"))
      .toEqual({ trackIndex: 0, stepIndex: 0 });
    expect(moveGridCursor(geometry, { trackIndex: 0, stepIndex: 0 }, "down"))
      .toEqual({ trackIndex: 1, stepIndex: 0 });
    expect(moveGridCursor(geometry, { trackIndex: 7, stepIndex: 15 }, "right"))
      .toEqual({ trackIndex: 7, stepIndex: 15 });
  });
});
