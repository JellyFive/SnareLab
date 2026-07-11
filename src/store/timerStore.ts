import { create } from "zustand";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

type TimerState = {
  status: TimerStatus;
  startTime?: Date;
  endTime?: Date;
  elapsedSeconds: number;
  lastResumedAt?: Date;
  start: (now?: Date) => void;
  pause: (now?: Date) => void;
  resume: (now?: Date) => void;
  tick: (now?: Date) => void;
  finish: (now?: Date) => void;
  reset: () => void;
};

function elapsedSinceLastResume(state: TimerState, now: Date): number {
  if (state.status !== "running" || !state.lastResumedAt) return state.elapsedSeconds;
  return state.elapsedSeconds + Math.max(0, Math.floor((now.getTime() - state.lastResumedAt.getTime()) / 1000));
}

export const useTimerStore = create<TimerState>((set, get) => ({
  status: "idle", elapsedSeconds: 0,
  start: (now = new Date()) => set({ status: "running", startTime: now, endTime: undefined, elapsedSeconds: 0, lastResumedAt: now }),
  pause: (now = new Date()) => set((state) => ({ status: "paused", elapsedSeconds: elapsedSinceLastResume(state, now), lastResumedAt: undefined })),
  resume: (now = new Date()) => set({ status: "running", lastResumedAt: now }),
  tick: (now = new Date()) => set((state) => ({ elapsedSeconds: elapsedSinceLastResume(state, now), lastResumedAt: state.status === "running" ? now : state.lastResumedAt })),
  finish: (now = new Date()) => {
    const state = get();
    set({ status: "finished", endTime: now, elapsedSeconds: elapsedSinceLastResume(state, now), lastResumedAt: undefined });
  },
  reset: () => set({ status: "idle", startTime: undefined, endTime: undefined, elapsedSeconds: 0, lastResumedAt: undefined }),
}));
