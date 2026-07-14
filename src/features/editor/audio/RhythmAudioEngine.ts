import { RHYTHM_TRACK_IDS, type RhythmDocument, type RhythmTrackId } from "../../../types";
import { getAudibleTrackIds } from "../domain/rhythmCommands";
import { documentEndTick, tickToSeconds } from "../domain/rhythmTiming";
import { SAMPLE_MANIFEST } from "./sampleManifest";

const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;
const EPSILON = 0.0001;

export type AudioEngineStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "error";

export interface AudioEngineState {
  status: AudioEngineStatus;
  playheadTick: number;
  errorTrackId?: RhythmTrackId;
  error?: string;
}

export interface RhythmAudioEngineDependencies {
  createAudioContext(): AudioContext;
  fetchSample(url: string): Promise<ArrayBuffer>;
  setInterval(callback: () => void, ms: number): number;
  clearInterval(id: number): void;
}

type ScheduledSource = AudioBufferSourceNode;

function defaultDependencies(): RhythmAudioEngineDependencies {
  return {
    createAudioContext: () => {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) {
        throw new Error("This browser does not support Web Audio.");
      }
      return new AudioContextConstructor();
    },
    fetchSample: async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Unable to fetch ${url}.`);
      return response.arrayBuffer();
    },
    setInterval: (callback, milliseconds) => window.setInterval(callback, milliseconds),
    clearInterval: (id) => window.clearInterval(id),
  };
}

export class RhythmAudioEngine {
  private readonly dependencies: RhythmAudioEngineDependencies;
  private context?: AudioContext;
  private masterGain?: GainNode;
  private loadPromise?: Promise<void>;
  private readonly buffers = new Map<RhythmTrackId, AudioBuffer>();
  private readonly listeners = new Set<(state: AudioEngineState) => void>();
  private readonly scheduledSources = new Set<ScheduledSource>();
  private schedulerId?: number;
  private document?: RhythmDocument;
  private bpm = 120;
  private loop = false;
  private volume = 1;
  private startedAt = 0;
  private startTick = 0;
  private nextScheduleTick = -1;
  private pausedTick = 0;
  private state: AudioEngineState = { status: "idle", playheadTick: 0 };

  constructor(dependencies: Partial<RhythmAudioEngineDependencies> = {}) {
    this.dependencies = { ...defaultDependencies(), ...dependencies };
  }

  async load(): Promise<void> {
    if (this.buffers.size === RHYTHM_TRACK_IDS.length) return;
    if (this.loadPromise) return this.loadPromise;

    this.updateState({ status: "loading", playheadTick: this.pausedTick });
    this.loadPromise = this.loadSamples();
    try {
      await this.loadPromise;
      this.updateState({ status: "ready", playheadTick: this.pausedTick });
    } catch (error) {
      this.loadPromise = undefined;
      this.updateState({
        status: "error",
        playheadTick: this.pausedTick,
        errorTrackId: this.state.errorTrackId,
        error: error instanceof Error ? error.message : "Audio initialization failed.",
      });
      throw error;
    }
  }

  async play(document: RhythmDocument, startTick = this.pausedTick): Promise<void> {
    this.setDocument(document);
    await this.load();
    if (!this.context || !this.masterGain) throw new Error("Audio output is unavailable.");
    await this.context.resume();

    this.clearScheduler();
    this.stopScheduledSources();
    this.bpm = document.bpm;
    this.startTick = this.normalizeTick(startTick);
    this.pausedTick = this.startTick;
    this.startedAt = this.context.currentTime;
    this.nextScheduleTick = -1;
    this.updateState({ status: "playing", playheadTick: this.startTick });
    this.schedule();
    this.schedulerId = this.dependencies.setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
  }

  pause(): number {
    if (this.state.status !== "playing") return this.pausedTick;
    this.pausedTick = this.getPlayheadTick();
    this.clearScheduler();
    this.stopScheduledSources();
    this.updateState({ status: "paused", playheadTick: this.pausedTick });
    return this.pausedTick;
  }

  stop(): void {
    this.clearScheduler();
    this.stopScheduledSources();
    this.pausedTick = 0;
    this.updateState({
      status: this.buffers.size === RHYTHM_TRACK_IDS.length ? "ready" : "idle",
      playheadTick: 0,
    });
  }

  setDocument(document: RhythmDocument): void {
    this.document = document;
    this.bpm = document.bpm;
  }

  setBpm(bpm: number): void {
    if (!Number.isInteger(bpm) || bpm < 40 || bpm > 240) {
      throw new RangeError("bpm must be an integer from 40 to 240.");
    }
    if (this.state.status === "playing" && this.context) {
      const elapsedTicks = this.absoluteTickAt(this.context.currentTime);
      this.startTick = this.getPlayheadTick();
      this.startedAt = this.context.currentTime;
      this.nextScheduleTick = Math.max(-1, this.nextScheduleTick - elapsedTicks);
    }
    this.bpm = bpm;
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new RangeError("volume must be a number from 0 to 1.");
    }
    this.volume = volume;
    if (this.masterGain) this.masterGain.gain.value = volume;
  }

  getPlayheadTick(): number {
    if (this.state.status !== "playing" || !this.context || !this.document) {
      return this.pausedTick;
    }

    const elapsedTicks = (this.context.currentTime - this.startedAt) * (this.bpm / 60) * 480;
    const rawTick = this.startTick + elapsedTicks;
    const endTick = documentEndTick(this.document);
    const playheadTick = this.loop ? rawTick % endTick : Math.min(rawTick, endTick);
    return Math.floor(playheadTick);
  }

  getState(): AudioEngineState {
    return { ...this.state, playheadTick: this.getPlayheadTick() };
  }

  subscribe(listener: (state: AudioEngineState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.stop();
    this.listeners.clear();
    if (this.context && this.context.state !== "closed") void this.context.close();
    this.context = undefined;
    this.masterGain = undefined;
    this.buffers.clear();
    this.loadPromise = undefined;
  }

  private async loadSamples(): Promise<void> {
    this.context ??= this.dependencies.createAudioContext();
    this.masterGain ??= this.context.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.context.destination);

    for (const trackId of RHYTHM_TRACK_IDS) {
      if (this.buffers.has(trackId)) continue;
      try {
        const rawSample = await this.dependencies.fetchSample(SAMPLE_MANIFEST[trackId].url);
        this.buffers.set(trackId, await this.context.decodeAudioData(rawSample));
      } catch (error) {
        this.updateState({
          status: "error",
          playheadTick: this.pausedTick,
          errorTrackId: trackId,
          error: `Unable to load ${SAMPLE_MANIFEST[trackId].label} sample.`,
        });
        throw new Error(`Unable to load ${SAMPLE_MANIFEST[trackId].label} sample.`, { cause: error });
      }
    }
  }

  private schedule(): void {
    if (this.state.status !== "playing" || !this.context || !this.document || !this.masterGain) return;

    const endTick = documentEndTick(this.document);
    const currentOffsetTick = Math.max(0, this.absoluteTickAt(this.context.currentTime));
    if (!this.loop && this.startTick + currentOffsetTick >= endTick) {
      this.clearScheduler();
      this.stopScheduledSources();
      this.pausedTick = 0;
      this.updateState({ status: "ready", playheadTick: 0 });
      return;
    }

    const horizonTick = this.absoluteTickAt(this.context.currentTime + SCHEDULE_AHEAD_SECONDS);
    const audibleTrackIds = getAudibleTrackIds(this.document.tracks);
    const events = this.eventsThrough(horizonTick, endTick, audibleTrackIds);
    for (const event of events) this.scheduleNote(event.trackId, event.absoluteTick, endTick, event.velocity);
    this.nextScheduleTick = Math.max(this.nextScheduleTick, horizonTick);
    this.updateState({ status: "playing", playheadTick: this.getPlayheadTick() });
  }

  private eventsThrough(endAbsoluteTick: number, documentEnd: number, audibleTrackIds: Set<RhythmTrackId>) {
    if (!this.document) return [];
    const sourceNotes = this.document.notes
      .filter((note) => audibleTrackIds.has(note.trackId))
      .sort((left, right) => left.tick - right.tick || RHYTHM_TRACK_IDS.indexOf(left.trackId) - RHYTHM_TRACK_IDS.indexOf(right.trackId));
    const events: Array<{ absoluteTick: number; trackId: RhythmTrackId; velocity: number }> = [];

    for (const note of sourceNotes) {
      const initialOffset = (note.tick - this.startTick + documentEnd) % documentEnd;
      for (let absoluteTick = initialOffset; absoluteTick <= endAbsoluteTick; absoluteTick += documentEnd) {
        if (absoluteTick > this.nextScheduleTick + EPSILON) {
          events.push({ absoluteTick, trackId: note.trackId, velocity: note.velocity });
        }
        if (!this.loop) break;
      }
    }

    return events.sort((left, right) =>
      left.absoluteTick - right.absoluteTick || RHYTHM_TRACK_IDS.indexOf(left.trackId) - RHYTHM_TRACK_IDS.indexOf(right.trackId),
    );
  }

  private scheduleNote(trackId: RhythmTrackId, absoluteTick: number, documentEnd: number, velocity: number): void {
    if (!this.context || !this.masterGain) return;
    const buffer = this.buffers.get(trackId);
    if (!buffer) return;
    const source = this.context.createBufferSource();
    const noteGain = this.context.createGain();
    source.buffer = buffer;
    noteGain.gain.value = velocity;
    source.connect(noteGain);
    noteGain.connect(this.masterGain);
    const when = this.startedAt + tickToSeconds(absoluteTick, this.bpm);
    source.start(when);
    this.scheduledSources.add(source);
    source.onended = () => this.scheduledSources.delete(source);
    void documentEnd;
  }

  private absoluteTickAt(time: number): number {
    return Math.max(0, (time - this.startedAt) * (this.bpm / 60) * 480);
  }

  private normalizeTick(tick: number): number {
    if (!this.document || !Number.isFinite(tick) || tick < 0) return 0;
    const endTick = documentEndTick(this.document);
    return this.loop ? Math.floor(tick % endTick) : Math.min(Math.floor(tick), endTick);
  }

  private clearScheduler(): void {
    if (this.schedulerId === undefined) return;
    this.dependencies.clearInterval(this.schedulerId);
    this.schedulerId = undefined;
  }

  private stopScheduledSources(): void {
    for (const source of this.scheduledSources) {
      try {
        source.stop();
      } catch {
        // A finished source may reject a second stop; it is already silent.
      }
      source.disconnect();
    }
    this.scheduledSources.clear();
  }

  private updateState(state: AudioEngineState): void {
    this.state = state;
    for (const listener of this.listeners) listener(this.getState());
  }
}
