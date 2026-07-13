import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultRhythmDocument } from "../domain/rhythmCommands";
import { RhythmGridCanvas } from "./RhythmGridCanvas";

const context = {
  clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
  lineTo: vi.fn(), stroke: vi.fn(), fillText: vi.fn(), setTransform: vi.fn(),
  save: vi.fn(), restore: vi.fn(),
  fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "left",
} as unknown as CanvasRenderingContext2D;

describe("RhythmGridCanvas", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
  });

  function setup() {
    const document = createDefaultRhythmDocument("测试节奏");
    const onToggleNote = vi.fn();
    const onCursorChange = vi.fn();
    render(
      <RhythmGridCanvas
        document={document}
        cursorTick={0}
        cursorTrackId="hi-hat"
        playheadTick={0}
        onToggleNote={onToggleNote}
        onCursorChange={onCursorChange}
      />,
    );
    const grid = screen.getByRole("grid");
    const canvas = grid.querySelector("canvas")!;
    Object.defineProperty(canvas, "setPointerCapture", { value: vi.fn(), configurable: true });
    Object.defineProperty(canvas, "releasePointerCapture", { value: vi.fn(), configurable: true });
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 512, bottom: 388,
      width: 512, height: 388, toJSON: () => ({}),
    });
    return { grid, canvas, onToggleNote, onCursorChange };
  }

  it("scales the backing canvas by DPR while retaining CSS dimensions", () => {
    const { canvas } = setup();
    expect(canvas).toHaveAttribute("width", "1024");
    expect(canvas).toHaveAttribute("height", "776");
    expect(canvas.style.width).toBe("512px");
    expect(canvas.style.height).toBe("388px");
  });

  it("toggles one pointer cell but does not draw while dragging", () => {
    const { canvas, onToggleNote } = setup();
    fireEvent.pointerDown(canvas, { clientX: 33, clientY: 37, pointerId: 1 });
    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
    fireEvent.pointerUp(canvas, { clientX: 33, clientY: 37, pointerId: 1 });
    expect(onToggleNote).toHaveBeenCalledWith("hi-hat", 120);

    fireEvent.pointerDown(canvas, { clientX: 1, clientY: 37, pointerId: 2 });
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 37, pointerId: 2 });
    fireEvent.pointerUp(canvas, { clientX: 80, clientY: 37, pointerId: 2 });
    expect(onToggleNote).toHaveBeenCalledOnce();

    fireEvent.pointerDown(canvas, { clientX: 1, clientY: 37, pointerId: 3 });
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 37, pointerId: 3 });
    fireEvent.pointerMove(canvas, { clientX: 1, clientY: 37, pointerId: 3 });
    fireEvent.pointerUp(canvas, { clientX: 1, clientY: 37, pointerId: 3 });
    expect(onToggleNote).toHaveBeenCalledOnce();
  });

  it("clears a cancelled pointer gesture", () => {
    const { canvas, onToggleNote } = setup();
    fireEvent.pointerDown(canvas, { clientX: 1, clientY: 37, pointerId: 4 });
    fireEvent.pointerCancel(canvas, { pointerId: 4 });
    fireEvent.pointerUp(canvas, { clientX: 1, clientY: 37, pointerId: 4 });
    expect(onToggleNote).not.toHaveBeenCalled();
  });

  it("moves with arrows and toggles the active cell with Space or Enter", () => {
    const { grid, onCursorChange, onToggleNote } = setup();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(onCursorChange).toHaveBeenCalledWith("hi-hat", 120);
    fireEvent.keyDown(grid, { key: " " });
    fireEvent.keyDown(grid, { key: "Enter" });
    expect(onToggleNote).toHaveBeenNthCalledWith(1, "hi-hat", 0);
    expect(onToggleNote).toHaveBeenNthCalledWith(2, "hi-hat", 0);
  });

  it("exposes the active cell and note state through grid semantics", () => {
    const { grid } = setup();
    expect(grid).toHaveAttribute("aria-rowcount", "8");
    expect(grid).toHaveAttribute("aria-colcount", "16");
    expect(grid).toHaveAttribute("aria-activedescendant", "rhythm-grid-active-cell");
    const cell = screen.getByRole("gridcell");
    expect(cell.parentElement).toHaveAttribute("role", "row");
    expect(cell).toHaveAccessibleName(/Hi-Hat.*无音符/);
  });

  it("does not reallocate the backing canvas for playhead-only redraws", () => {
    const document = createDefaultRhythmDocument("测试节奏");
    const { rerender } = render(
      <RhythmGridCanvas document={document} cursorTick={0} cursorTrackId="hi-hat"
        playheadTick={0} onToggleNote={vi.fn()} onCursorChange={vi.fn()} />,
    );
    const canvas = screen.getByRole("grid").querySelector("canvas")!;
    const widthSetter = vi.spyOn(canvas, "width", "set");
    const drawCount = vi.mocked(context.clearRect).mock.calls.length;
    rerender(
      <RhythmGridCanvas document={document} cursorTick={0} cursorTrackId="hi-hat"
        playheadTick={120} onToggleNote={vi.fn()} onCursorChange={vi.fn()} />,
    );
    expect(widthSetter).not.toHaveBeenCalled();
    expect(context.clearRect).toHaveBeenCalledTimes(drawCount);
    expect(screen.getByTestId("rhythm-grid-playhead")).toHaveStyle({
      transform: "translateX(32px)",
    });
  });

  it("caps the effective backing ratio for a sixteen-measure high-DPR grid", () => {
    Object.defineProperty(window, "devicePixelRatio", { value: 3, configurable: true });
    const document = { ...createDefaultRhythmDocument("长节奏"), measureCount: 16 };
    render(
      <RhythmGridCanvas document={document} cursorTick={0} cursorTrackId="hi-hat"
        onToggleNote={vi.fn()} onCursorChange={vi.fn()} />,
    );
    const canvas = screen.getByRole("grid").querySelector("canvas")!;
    expect(canvas.width).toBeLessThanOrEqual(16_384);
    expect(canvas.height).toBeLessThanOrEqual(16_384);
  });

  it("uses the clamped active tick for its note-state description", () => {
    const base = createDefaultRhythmDocument("测试节奏");
    const document = {
      ...base,
      notes: [{ id: "last", trackId: "hi-hat" as const, tick: 1800,
        durationTicks: 120, velocity: 0.8, articulation: "normal" as const }],
    };
    render(
      <RhythmGridCanvas document={document} cursorTick={99_999} cursorTrackId="hi-hat"
        onToggleNote={vi.fn()} onCursorChange={vi.fn()} />,
    );
    expect(screen.getByRole("gridcell")).toHaveAccessibleName(/有音符/);
  });
});
