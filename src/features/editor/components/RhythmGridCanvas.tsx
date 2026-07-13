import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { RHYTHM_TRACK_IDS, type RhythmDocument, type RhythmTrackId } from "../../../types";
import { TICKS_PER_STEP } from "../domain/rhythmConstants";
import {
  cellToRect,
  createGridGeometry,
  hitTestGrid,
  moveGridCursor,
  type GridCell,
  type GridCursorDirection,
  type GridGeometry,
} from "../domain/rhythmGridGeometry";

const TRACK_NAMES: Record<RhythmTrackId, string> = {
  "hi-hat": "Hi-Hat", snare: "Snare", kick: "Kick", "tom-1": "Tom 1",
  "tom-2": "Tom 2", "tom-3": "Tom 3", ride: "Ride", crash: "Crash",
};
const ACTIVE_CELL_ID = "rhythm-grid-active-cell";
const MAX_CANVAS_DIMENSION = 16_384;
const MAX_CANVAS_PIXELS = 16_777_216;

export interface RhythmGridCanvasProps {
  document: RhythmDocument;
  cursorTick: number;
  cursorTrackId: RhythmTrackId;
  playheadTick?: number;
  onToggleNote: (trackId: RhythmTrackId, tick: number) => void;
  onCursorChange: (trackId: RhythmTrackId, tick: number) => void;
}

export function RhythmGridCanvas(props: RhythmGridCanvasProps) {
  const { document, cursorTick, cursorTrackId, playheadTick, onToggleNote, onCursorChange } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number; dragged: boolean; cell?: GridCell } | undefined>(undefined);
  const drawRef = useRef<() => void>(() => undefined);
  const renderMetricsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const [announcement, setAnnouncement] = useState("");
  const geometry = useMemo(() => createGridGeometry(document.measureCount), [document.measureCount]);
  const cursor: GridCell = {
    trackIndex: Math.max(0, RHYTHM_TRACK_IDS.indexOf(cursorTrackId)),
    stepIndex: Math.max(0, Math.min(geometry.stepCount - 1, Math.floor(cursorTick / TICKS_PER_STEP))),
  };
  const activeTick = cursor.stepIndex * TICKS_PER_STEP;
  const hasNote = document.notes.some((note) => note.trackId === cursorTrackId && note.tick === activeTick);

  drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const { dpr } = renderMetricsRef.current;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid(context, geometry, document, cursor);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeAndDraw = (width: number, height: number) => {
      const dpr = effectiveCanvasDpr(width, height, window.devicePixelRatio || 1);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      renderMetricsRef.current = { width, height, dpr };
      drawRef.current();
    };
    resizeAndDraw(geometry.width, geometry.height);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const size = entries[0]?.contentRect;
      if (size?.width && size?.height) resizeAndDraw(size.width, size.height);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [geometry.height, geometry.width]);

  useEffect(() => {
    drawRef.current();
  }, [cursor.stepIndex, cursor.trackIndex, document, geometry]);

  const pointForEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (geometry.width / rect.width),
      y: (event.clientY - rect.top) * (geometry.height / rect.height),
    };
  };

  const activate = (cell: GridCell) => {
    const trackId = RHYTHM_TRACK_IDS[cell.trackIndex];
    const tick = cell.stepIndex * TICKS_PER_STEP;
    const removing = document.notes.some((note) => note.trackId === trackId && note.tick === tick);
    onCursorChange(trackId, tick);
    onToggleNote(trackId, tick);
    setAnnouncement(formatAnnouncement(trackId, cell.stepIndex, removing ? "已删除音符" : "已添加音符"));
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointForEvent(event);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerStartRef.current = {
      ...point,
      pointerId: event.pointerId,
      dragged: false,
      cell: hitTestGrid(geometry, point),
    };
  };
  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== event.pointerId || start.dragged) return;
    const point = pointForEvent(event);
    if (Math.hypot(point.x - start.x, point.y - start.y) > 6) start.dragged = true;
  };
  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = undefined;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!start?.cell || start.pointerId !== event.pointerId || start.dragged) return;
    const point = pointForEvent(event);
    if (Math.hypot(point.x - start.x, point.y - start.y) > 6) return;
    const end = hitTestGrid(geometry, point);
    if (end?.trackIndex === start.cell.trackIndex && end.stepIndex === start.cell.stepIndex) activate(end);
  };
  const handlePointerCancel = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (pointerStartRef.current?.pointerId === event.pointerId) pointerStartRef.current = undefined;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const directions: Partial<Record<string, GridCursorDirection>> = {
      ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    };
    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      const next = moveGridCursor(geometry, cursor, direction);
      onCursorChange(RHYTHM_TRACK_IDS[next.trackIndex], next.stepIndex * TICKS_PER_STEP);
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      activate(cursor);
    }
  };

  return (
    <div className="rhythm-grid-scroll">
      <div
        className="rhythm-grid"
        role="grid"
        tabIndex={0}
        aria-label="鼓组节奏网格"
        aria-rowcount={geometry.trackCount}
        aria-colcount={geometry.stepCount}
        aria-activedescendant={ACTIVE_CELL_ID}
        onKeyDown={handleKeyDown}
      >
        <canvas
          ref={canvasRef}
          className="rhythm-grid__canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          aria-hidden="true"
        />
        {playheadTick !== undefined ? (
          <div
            className="rhythm-grid__playhead"
            data-testid="rhythm-grid-playhead"
            aria-hidden="true"
            style={{
              height: geometry.height,
              transform: `translateX(${(playheadTick / TICKS_PER_STEP) * geometry.stepWidth}px)`,
            }}
          />
        ) : null}
        <div className="visually-hidden" role="row" aria-rowindex={cursor.trackIndex + 1}>
          <div
            id={ACTIVE_CELL_ID}
            role="gridcell"
            aria-rowindex={cursor.trackIndex + 1}
            aria-colindex={cursor.stepIndex + 1}
            aria-label={`${TRACK_NAMES[cursorTrackId]}，${formatPosition(cursor.stepIndex)}，${hasNote ? "有音符" : "无音符"}`}
          />
        </div>
        <div className="visually-hidden" aria-live="polite">{announcement}</div>
      </div>
    </div>
  );
}

function effectiveCanvasDpr(width: number, height: number, requestedDpr: number) {
  const dimensionLimit = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
  const pixelLimit = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  return Math.max(1, Math.min(requestedDpr, dimensionLimit, pixelLimit));
}

function drawGrid(context: CanvasRenderingContext2D, geometry: GridGeometry, document: RhythmDocument, cursor: GridCell) {
  context.clearRect(0, 0, geometry.width, geometry.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, geometry.width, geometry.height);
  context.fillStyle = "#f8f9fc";
  context.fillRect(0, 0, geometry.width, geometry.headerHeight);
  for (let row = 0; row <= geometry.trackCount; row += 1) drawHorizontalLine(context, geometry.headerHeight + row * geometry.rowHeight, geometry.width, "#eceef2", 1);
  for (let step = 0; step <= geometry.stepCount; step += 1) {
    const x = step * geometry.stepWidth;
    const isMeasure = step % 16 === 0;
    const isBeat = step % 4 === 0;
    drawVerticalLine(context, x, geometry.height, isMeasure ? "#b9bfd4" : isBeat ? "#d8dbe7" : "#eceef2", isMeasure ? 2 : 1);
    if (step < geometry.stepCount && isBeat) {
      context.fillStyle = "#6f7485";
      context.font = "600 11px system-ui";
      context.fillText(String((step % 16) / 4 + 1), x + 8, 22);
    }
  }
  const cursorRect = cellToRect(geometry, cursor.trackIndex, cursor.stepIndex);
  context.fillStyle = "rgba(91, 99, 246, 0.10)";
  context.fillRect(cursorRect.x + 1, cursorRect.y + 1, cursorRect.width - 2, cursorRect.height - 2);
  for (const note of document.notes) {
    const trackIndex = RHYTHM_TRACK_IDS.indexOf(note.trackId);
    const stepIndex = Math.floor(note.tick / TICKS_PER_STEP);
    if (trackIndex < 0 || stepIndex >= geometry.stepCount) continue;
    const rect = cellToRect(geometry, trackIndex, stepIndex);
    context.fillStyle = note.trackId === "hi-hat" || note.trackId === "crash" ? "#8b5cf6" : note.trackId === "kick" ? "#ef5b62" : "#3478f6";
    context.fillRect(rect.x + 5, rect.y + 7, rect.width - 10, rect.height - 14);
  }
}

function drawVerticalLine(context: CanvasRenderingContext2D, x: number, height: number, color: string, width: number) {
  context.beginPath(); context.strokeStyle = color; context.lineWidth = width;
  context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
}

function drawHorizontalLine(context: CanvasRenderingContext2D, y: number, width: number, color: string, lineWidth: number) {
  context.beginPath(); context.strokeStyle = color; context.lineWidth = lineWidth;
  context.moveTo(0, y); context.lineTo(width, y); context.stroke();
}

function formatPosition(stepIndex: number) {
  const local = stepIndex % 16;
  return `第 ${Math.floor(stepIndex / 16) + 1} 小节，第 ${Math.floor(local / 4) + 1} 拍第 ${local % 4 + 1} 格`;
}

function formatAnnouncement(trackId: RhythmTrackId, stepIndex: number, action: string) {
  return `${TRACK_NAMES[trackId]}，${formatPosition(stepIndex)}，${action}`;
}
