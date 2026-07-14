import { act, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultRhythmDocument } from "../domain/rhythmCommands";
import { useEditorAudio, type EditorAudioEngine } from "./useEditorAudio";
import type { AudioEngineState } from "../audio/RhythmAudioEngine";

class FakeEngine implements EditorAudioEngine {
  state: AudioEngineState = { status: "ready", playheadTick: 0 };
  listener?: (state: AudioEngineState) => void;
  load = vi.fn(async () => undefined);
  play = vi.fn(async () => undefined);
  pause = vi.fn(() => 120);
  stop = vi.fn();
  setDocument = vi.fn();
  setBpm = vi.fn();
  setLoop = vi.fn();
  setVolume = vi.fn();
  getPlayheadTick = vi.fn(() => this.state.playheadTick);
  getState = vi.fn(() => this.state);
  subscribe = vi.fn((listener: (state: AudioEngineState) => void) => {
    this.listener = listener;
    return () => { this.listener = undefined; };
  });
  dispose = vi.fn();
  emit(state: AudioEngineState) { this.state = state; this.listener?.(state); }
}

function Harness({ document, engine, onAudio }: { document: ReturnType<typeof createDefaultRhythmDocument>; engine: FakeEngine; onAudio?: (audio: ReturnType<typeof useEditorAudio>) => void }) {
  const audio = useEditorAudio(document, { createEngine: () => engine });
  useEffect(() => onAudio?.(audio), [audio, onAudio]);
  return <output data-testid="playhead">{audio.playheadTick}</output>;
}

describe("useEditorAudio", () => {
  it("loads once, forwards the current document, and only stops when document identity changes", async () => {
    const engine = new FakeEngine();
    const first = createDefaultRhythmDocument("第一段");
    const { rerender } = render(<Harness document={first} engine={engine} />);
    await waitFor(() => expect(engine.load).toHaveBeenCalledOnce());
    expect(engine.setDocument).toHaveBeenCalledWith(first);

    const edited = { ...first, bpm: 140 };
    rerender(<Harness document={edited} engine={engine} />);
    expect(engine.setDocument).toHaveBeenLastCalledWith(edited);
    expect(engine.stop).not.toHaveBeenCalled();

    rerender(<Harness document={{ ...edited, id: "second" }} engine={engine} />);
    expect(engine.stop).toHaveBeenCalledOnce();
  });

  it("forwards transport actions and updates the playhead from engine subscription", async () => {
    const engine = new FakeEngine();
    const document = createDefaultRhythmDocument("第一段");
    let audio: ReturnType<typeof useEditorAudio> | undefined;
    render(<Harness document={document} engine={engine} onAudio={(value) => { audio = value; }} />);
    await waitFor(() => expect(audio).toBeDefined());

    await act(async () => { await audio?.play(); });
    expect(engine.play).toHaveBeenCalledWith(document);
    act(() => engine.emit({ status: "playing", playheadTick: 120 }));
    expect(screen.getByTestId("playhead")).toHaveTextContent("120");
    act(() => audio?.setBpm(140));
    act(() => audio?.setLoop(true));
    act(() => audio?.setVolume(0.5));
    expect(engine.setBpm).toHaveBeenCalledWith(140);
    expect(engine.setLoop).toHaveBeenCalledWith(true);
    expect(engine.setVolume).toHaveBeenCalledWith(0.5);
  });

  it("turns a playback-start failure into visible audio state", async () => {
    const engine = new FakeEngine();
    engine.play.mockRejectedValueOnce(new Error("audio permission denied"));
    const rhythm = createDefaultRhythmDocument("第一段");
    let audio: ReturnType<typeof useEditorAudio> | undefined;
    render(<Harness document={rhythm} engine={engine} onAudio={(value) => { audio = value; }} />);
    await waitFor(() => expect(audio).toBeDefined());

    await act(async () => { await audio?.play(); });

    await waitFor(() => expect(audio?.status).toBe("error"));
    expect(audio?.error).toBe("audio permission denied");
  });

  it("stops when hidden and disposes on unmount", async () => {
    const engine = new FakeEngine();
    const document = createDefaultRhythmDocument("第一段");
    const { unmount } = render(<Harness document={document} engine={engine} />);
    await waitFor(() => expect(engine.load).toHaveBeenCalledOnce());

    Object.defineProperty(window.document, "visibilityState", { configurable: true, value: "hidden" });
    window.document.dispatchEvent(new Event("visibilitychange"));
    expect(engine.stop).toHaveBeenCalledOnce();
    unmount();
    expect(engine.dispose).toHaveBeenCalledOnce();
  });
});
