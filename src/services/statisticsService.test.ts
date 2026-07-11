import { describe, expect, it } from "vitest";

import { calculateStatistics } from "./statisticsService";

const session = (id: string, date: Date, duration: number, categoryId: string, tagIds: string[] = []) => ({
  id,
  startTime: date,
  endTime: new Date(date.getTime() + duration * 1_000),
  duration,
  categoryId,
  tagIds,
  createdAt: date,
  updatedAt: date,
});

describe("calculateStatistics", () => {
  it("calculates total, selected-period time, current streak, and session count", () => {
    const sessions = [
      session("july-3", new Date(2026, 6, 3, 9), 1_800, "fundamentals"),
      session("july-4", new Date(2026, 6, 4, 9), 3_600, "coordination"),
      session("july-5-a", new Date(2026, 6, 5, 9), 900, "fundamentals"),
      session("july-5-b", new Date(2026, 6, 5, 12), 600, "fundamentals"),
      session("june-20", new Date(2026, 5, 20, 9), 1_200, "song-practice"),
    ];

    const result = calculateStatistics(sessions, {
      now: new Date(2026, 6, 5, 15),
      period: "week",
    });

    expect(result.totalDuration).toBe(8_100);
    expect(result.periodDuration).toBe(6_900);
    expect(result.currentStreak).toBe(3);
    expect(result.sessionCount).toBe(5);
  });

  it("aggregates category distribution without using tags", () => {
    const sessions = [
      session("one", new Date(2026, 6, 1, 9), 1_800, "fundamentals", ["timing"]),
      session("two", new Date(2026, 6, 2, 9), 900, "fundamentals", ["groove", "speed"]),
      session("three", new Date(2026, 6, 2, 11), 1_200, "coordination", ["timing"]),
    ];

    const result = calculateStatistics(sessions, { now: new Date(2026, 6, 2), period: "month" });

    expect(result.categoryDistribution).toEqual([
      { categoryId: "fundamentals", duration: 2_700, sessionCount: 2 },
      { categoryId: "coordination", duration: 1_200, sessionCount: 1 },
    ]);
    expect(result.categoryDistribution.map((item) => item.categoryId)).not.toContain("timing");
  });

  it("returns a daily heatmap summary for the requested month", () => {
    const sessions = [
      session("one", new Date(2026, 6, 2, 9), 900, "fundamentals"),
      session("two", new Date(2026, 6, 2, 11), 600, "coordination"),
      session("three", new Date(2026, 6, 10, 9), 1_800, "fundamentals"),
      session("outside", new Date(2026, 5, 30, 9), 1_200, "fundamentals"),
    ];

    const result = calculateStatistics(sessions, { now: new Date(2026, 6, 10), period: "month" });

    expect(result.heatmap).toEqual([
      { date: "2026-07-02", duration: 1_500, sessionCount: 2 },
      { date: "2026-07-10", duration: 1_800, sessionCount: 1 },
    ]);
  });
});
