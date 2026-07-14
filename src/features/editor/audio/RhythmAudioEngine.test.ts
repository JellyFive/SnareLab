import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultRhythmDocument, toggleNote } from "../domain/rhythmCommands";
import { RhythmAudioEngine } from "./RhythmAudioEngine";

class FakeGainNode {
  gain = { value: 1 };
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeSourceNode {
  buffer: AudioBuffer | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  state: AudioContextState = "suspended";
  sources: FakeSourceNode[] = [];
  gains: FakeGainNode[] = [];
  decodeAudioData = vi.fn(async () => ({}) as unknown as AudioBuffer);
  createBufferSource = vi.fn(() => {
    const source = new FakeSourceNode();
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  });
  createGain = vi.fn(() => {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  });
  resume = vi.fn(async () => {
    this.state = "running";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
}

function createDocument() {
  const now = new Date("2026-07-14T00:00:00.000Z");
  const oneMeasure = createDefaultRhythmDocument("Audio test", now);
  return toggleNote("kick", 0)(
    toggleNote("snare", 0)(
      toggleNote("hi-hat", 120)({ ...oneMeasure, updatedAt: now }),
    ),
  );
}

function createHarness() {
  const context = new FakeAudioContext();
  let nextTimer = 1;
  const timers = new Map<number, () => void>();
  const fetchSample = vi.fn(async () => new ArrayBuffer(8));
  const engine = new RhythmAudioEngine({
    createAudioContext: () => context as unknown as AudioContext,
    fetchSample,
    setInterval: (callback) => {
      const id = nextTimer++;
      timers.set(id, callback);
      return id;
    },
    clearInterval: (id) => {
      timers.delete(id);
    },
  });

  return {
    context,
    engine,
    fetchSample,
    runScheduler: () => [...timers.values()].forEach((callback) => callback()),
    timerCount: () => timers.size,
  };
}

describe("RhythmAudioEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads each local sample once and caches decoded buffers", async () => {
    const { context, engine, fetchSample } = createHarness();

    await engine.load();
    await engine.load();

    expect(fetchSample).toHaveBeenCalledTimes(8);
    expect(context.decodeAudioData).toHaveBeenCalledTimes(8);
    expect(context.createGain).toHaveBeenCalledTimes(1);
  });

  it("identifies the track whose sample fails to load", async () => {
    const { engine, fetchSample } = createHarness();
    fetchSample.mockRejectedValueOnce(new Error("network"));

    await expect(engine.load()).rejects.toThrow("Hi-Hat");
    expect(engine.getState()).toMatchObject({ status: "error", errorTrackId: "hi-hat" });
  });

  it("reports an error state when Web Audio is unavailable", async () => {
    const engine = new RhythmAudioEngine({
      createAudioContext: () => {
        throw new Error("unsupported");
      },
    });

    await expect(engine.load()).rejects.toThrow("unsupported");
    expect(engine.getState()).toMatchObject({ status: "error", playheadTick: 0 });
  });

  it("schedules audible notes in tick and track order with velocity gain", async () => {
    const { context, engine } = createHarness();
    const document = createDocument();

    await engine.play(document);

    expect(context.sources).toHaveLength(2);
    expect(context.sources.map((source) => source.start.mock.calls[0][0])).toEqual([0, 0]);
    expect(context.gains.slice(1).map((gain) => gain.gain.value)).toEqual([0.8, 0.8]);
    expect(context.sources.every((source) => source.connect.mock.calls[0][0] instanceof FakeGainNode)).toBe(true);
  });

  it("uses the audio clock and 100ms look-ahead window for later notes", async () => {
    const { context, engine, runScheduler } = createHarness();

    await engine.play(createDocument());
    context.currentTime = 0.03;
    runScheduler();

    expect(context.sources).toHaveLength(3);
    expect(context.sources[2].start).toHaveBeenCalledWith(0.125);
  });

  it("honors mute and solo before newly scheduled notes", async () => {
    const { context, engine, runScheduler } = createHarness();
    const document = createDocument();
    const mutedKick = {
      ...document,
      tracks: document.tracks.map((track) =>
        track.id === "kick" ? { ...track, mute: true } : track,
      ),
    };

    await engine.play(mutedKick);
    expect(context.sources).toHaveLength(1);

    engine.setDocument({
      ...mutedKick,
      tracks: mutedKick.tracks.map((track) =>
        track.id === "hi-hat" ? { ...track, solo: true } : track,
      ),
    });
    context.currentTime = 0.03;
    runScheduler();

    expect(context.sources).toHaveLength(2);
  });

  it("does not duplicate notes already inside the schedule-ahead window after a BPM change", async () => {
    const { context, engine, runScheduler } = createHarness();
    await engine.play(createDocument());

    engine.setBpm(100);
    runScheduler();

    expect(context.sources).toHaveLength(2);
  });

  it("pauses at the audio-clock tick and resumes from that tick", async () => {
    const { context, engine } = createHarness();
    await engine.play(createDocument());
    context.currentTime = 0.25;

    expect(engine.pause()).toBe(240);
    expect(engine.getPlayheadTick()).toBe(240);
    await engine.play(createDocument());

    expect(engine.getPlayheadTick()).toBe(240);
  });

  it("stops scheduled sources, clears the scheduler, and resets to tick zero", async () => {
    const { context, engine, timerCount } = createHarness();
    await engine.play(createDocument());

    engine.stop();

    expect(context.sources.every((source) => source.stop.mock.calls.length === 1)).toBe(true);
    expect(timerCount()).toBe(0);
    expect(engine.getPlayheadTick()).toBe(0);
    expect(engine.getState().status).toBe("ready");
  });

  it("wraps scheduled notes at the document end when looping", async () => {
    const { context, engine, runScheduler } = createHarness();
    const document = toggleNote("kick", 0)(createDocument());
    engine.setLoop(true);
    await engine.play(document, 1910);
    context.currentTime = 0.03;
    runScheduler();

    expect(engine.getState().status).toBe("playing");
    expect(context.sources.length).toBeGreaterThan(0);
  });

  it("stops after the document end when looping is disabled", async () => {
    const { context, engine, runScheduler, timerCount } = createHarness();
    await engine.play(createDocument(), 1910);
    context.currentTime = 0.03;
    runScheduler();

    expect(engine.getState().status).toBe("ready");
    expect(timerCount()).toBe(0);
  });

  it("disposes its timer, sources, and audio context", async () => {
    const { context, engine, timerCount } = createHarness();
    await engine.play(createDocument());

    engine.dispose();

    expect(timerCount()).toBe(0);
    expect(context.close).toHaveBeenCalledOnce();
    expect(context.sources.every((source) => source.stop.mock.calls.length === 1)).toBe(true);
  });
});
