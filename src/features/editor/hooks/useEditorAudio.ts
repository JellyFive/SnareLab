import { useCallback, useEffect, useRef, useState } from "react";
import type { RhythmDocument } from "../../../types";
import {
  RhythmAudioEngine,
  type AudioEngineState,
} from "../audio/RhythmAudioEngine";

export interface EditorAudioEngine {
  load(): Promise<void>;
  play(document: RhythmDocument, startTick?: number): Promise<void>;
  pause(): number;
  stop(): void;
  setDocument(document: RhythmDocument): void;
  setBpm(bpm: number): void;
  setLoop(loop: boolean): void;
  setVolume(volume: number): void;
  getPlayheadTick(): number;
  getState(): AudioEngineState;
  subscribe(listener: (state: AudioEngineState) => void): () => void;
  dispose(): void;
}

export interface UseEditorAudioOptions {
  createEngine?: () => EditorAudioEngine;
}

export function useEditorAudio(rhythmDocument: RhythmDocument | undefined, options: UseEditorAudioOptions = {}) {
  const engineRef = useRef<EditorAudioEngine | undefined>(undefined);
  if (!engineRef.current) engineRef.current = options.createEngine?.() ?? new RhythmAudioEngine();
  const engine = engineRef.current;
  const [state, setState] = useState<AudioEngineState>(() => engine.getState());
  const [loop, setLoopState] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const previousDocumentId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = engine.subscribe(setState);
    const onVisibilityChange = () => {
      if (window.document.visibilityState === "hidden") engine.stop();
    };
    window.document.addEventListener("visibilitychange", onVisibilityChange);
    void engine.load().catch(() => setState(engine.getState()));
    return () => {
      window.document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribe();
      engine.stop();
      engine.dispose();
    };
  }, [engine]);

  useEffect(() => {
    if (!rhythmDocument) return;
    if (previousDocumentId.current && previousDocumentId.current !== rhythmDocument.id) engine.stop();
    previousDocumentId.current = rhythmDocument.id;
    engine.setDocument(rhythmDocument);
  }, [rhythmDocument, engine]);

  useEffect(() => {
    if (state.status !== "playing") return;
    let frame = 0;
    const updatePlayhead = () => {
      setState((current) => ({ ...current, playheadTick: engine.getPlayheadTick() }));
      frame = requestAnimationFrame(updatePlayhead);
    };
    frame = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(frame);
  }, [engine, state.status]);

  const play = useCallback(async () => {
    if (!rhythmDocument) return;
    try {
      await engine.play(rhythmDocument);
    } catch (error) {
      setState({
        ...engine.getState(),
        status: "error",
        error: error instanceof Error ? error.message : "无法开始播放。",
      });
    }
  }, [rhythmDocument, engine]);
  const pause = useCallback(() => engine.pause(), [engine]);
  const stop = useCallback(() => engine.stop(), [engine]);
  const setDocument = useCallback((nextDocument: RhythmDocument) => engine.setDocument(nextDocument), [engine]);
  const setBpm = useCallback((bpm: number) => engine.setBpm(bpm), [engine]);
  const setLoop = useCallback((nextLoop: boolean) => {
    engine.setLoop(nextLoop);
    setLoopState(nextLoop);
  }, [engine]);
  const setVolume = useCallback((nextVolume: number) => {
    engine.setVolume(nextVolume);
    setVolumeState(nextVolume);
  }, [engine]);

  return { ...state, loop, volume, playheadTick: state.playheadTick, play, pause, stop, setDocument, setBpm, setLoop, setVolume };
}
