import { beforeEach, describe, expect, it } from "vitest";

import { useTimerStore } from "./timerStore";

describe("timerStore", () => {
  beforeEach(() => useTimerStore.getState().reset());

  it("moves through start, pause, resume, finish, and reset without counting paused time", () => {
    const store = useTimerStore.getState();
    store.start(new Date("2026-07-01T09:00:00.000Z"));
    expect(useTimerStore.getState().status).toBe("running");
    store.pause(new Date("2026-07-01T09:00:30.000Z"));
    expect(useTimerStore.getState().status).toBe("paused");
    expect(useTimerStore.getState().elapsedSeconds).toBe(30);
    store.resume(new Date("2026-07-01T09:01:30.000Z"));
    expect(useTimerStore.getState().status).toBe("running");
    store.finish(new Date("2026-07-01T09:02:00.000Z"));
    expect(useTimerStore.getState()).toMatchObject({ status: "finished", elapsedSeconds: 60 });
    store.reset();
    expect(useTimerStore.getState()).toMatchObject({ status: "idle", elapsedSeconds: 0 });
  });

  it("updates the visible elapsed time only while running", () => {
    const store = useTimerStore.getState();
    store.start(new Date("2026-07-01T09:00:00.000Z"));
    store.tick(new Date("2026-07-01T09:00:05.000Z"));
    expect(useTimerStore.getState().elapsedSeconds).toBe(5);
    store.pause(new Date("2026-07-01T09:00:05.000Z"));
    store.tick(new Date("2026-07-01T09:00:10.000Z"));
    expect(useTimerStore.getState().elapsedSeconds).toBe(5);
  });
});
