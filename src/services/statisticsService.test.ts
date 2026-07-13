import { describe, expect, it } from "vitest";

import { calculateClassificationStatistics, calculateDayStatistics, calculateMonthSummaries, calculateStatistics } from "./statisticsService";

const session = (id: string, date: Date, duration: number, categoryId: string, tagIds: string[] = []) => ({
  id,
  startTime: date,
  endTime: new Date(date.getTime() + duration * 1_000),
  duration,
  categoryId,
  tagIds,
  attachments: [],
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
      { categoryId: "fundamentals", duration: 2_700, percentage: 69, sessionCount: 2 },
      { categoryId: "coordination", duration: 1_200, percentage: 31, sessionCount: 1 },
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

  it("uses the selected natural month for distributions and keeps today separate from the period", () => {
    const sessions = [
      session("july-1", new Date(2026, 6, 1, 9), 1_800, "fundamentals", ["timing"]),
      session("july-31", new Date(2026, 6, 31, 22), 3_600, "coordination", ["timing", "speed"]),
      session("august", new Date(2026, 7, 1, 0), 7_200, "song-practice", ["speed"]),
      session("june", new Date(2026, 5, 30, 23), 900, "fundamentals", ["timing"]),
    ];

    const result = calculateStatistics(sessions, {
      now: new Date(2026, 6, 31, 23, 30),
      period: "month",
    });

    expect(result.periodDuration).toBe(5_400);
    expect(result.todayDuration).toBe(3_600);
    expect(result.categoryDistribution).toEqual([
      { categoryId: "coordination", duration: 3_600, percentage: 67, sessionCount: 1 },
      { categoryId: "fundamentals", duration: 1_800, percentage: 33, sessionCount: 1 },
    ]);
    expect(result.tagDistribution).toEqual([
      { duration: 5_400, percentage: 100, sessionCount: 2, tagId: "timing" },
      { duration: 3_600, percentage: 67, sessionCount: 1, tagId: "speed" },
    ]);
  });

  it("aggregates a full local calendar year including the cross-year boundary", () => {
    const sessions = [
      session("new-year", new Date(2026, 0, 1, 0, 5), 600, "fundamentals"),
      session("december", new Date(2026, 11, 31, 23, 55), 1_200, "coordination"),
      session("next-year", new Date(2027, 0, 1, 0, 5), 1_800, "song-practice"),
      session("previous-year", new Date(2025, 11, 31, 23, 55), 2_400, "fundamentals"),
    ];

    const result = calculateStatistics(sessions, {
      now: new Date(2026, 11, 31, 23, 59),
      period: "year",
    });

    expect(result.periodDuration).toBe(1_800);
    expect(result.heatmap).toEqual([
      { date: "2026-01-01", duration: 600, sessionCount: 1 },
      { date: "2026-12-31", duration: 1_200, sessionCount: 1 },
    ]);
  });

  it("returns stable empty statistics and does not divide by zero", () => {
    const result = calculateStatistics([], {
      now: new Date(2026, 6, 12, 10),
      period: "year",
    });

    expect(result).toMatchObject({
      categoryDistribution: [],
      currentStreak: 0,
      heatmap: [],
      periodDuration: 0,
      sessionCount: 0,
      tagDistribution: [],
      todayDuration: 0,
      totalDuration: 0,
    });
  });

  it("keeps today independent when browsing a completed earlier month", () => {
    const sessions = [
      session("june-early", new Date(2026, 5, 2, 9), 600, "fundamentals"),
      session("june-late", new Date(2026, 5, 30, 9), 1_200, "coordination"),
      session("today", new Date(2026, 6, 12, 9), 1_800, "fundamentals"),
    ];

    const result = calculateStatistics(sessions, {
      now: new Date(2026, 6, 12, 12),
      period: "month",
      periodDate: new Date(2026, 5, 18),
    });

    expect(result.todayDuration).toBe(1_800);
    expect(result.periodDuration).toBe(1_800);
    expect(result.heatmap.map((item) => item.date)).toEqual(["2026-06-02", "2026-06-30"]);
  });

  it("summarizes completed months in full and the current month only through today", () => {
    const summaries = calculateMonthSummaries([
      session("june", new Date(2026, 5, 30, 9), 1_800, "fundamentals"),
      session("july-before-now", new Date(2026, 6, 5, 9), 1_200, "coordination"),
      session("july-after-now", new Date(2026, 6, 20, 9), 3_600, "song-practice"),
    ], 2026, new Date(2026, 6, 5, 15));

    expect(summaries[5]).toMatchObject({ duration: 1_800, month: 5, practiceDays: 1, sessionCount: 1, year: 2026 });
    expect(summaries[6]).toMatchObject({ duration: 1_200, month: 6, practiceDays: 1, sessionCount: 1, year: 2026 });
    expect(summaries[7]).toMatchObject({ duration: 0, month: 7, practiceDays: 0, sessionCount: 0, year: 2026 });
  });

  it("returns one day of records in chronological order with a category duration distribution", () => {
    const result = calculateDayStatistics([
      session("late", new Date(2026, 6, 5, 18), 600, "fundamentals"),
      session("early", new Date(2026, 6, 5, 9), 1_200, "coordination"),
      session("outside", new Date(2026, 6, 6, 9), 1_800, "fundamentals"),
    ], new Date(2026, 6, 5));

    expect(result.duration).toBe(1_800);
    expect(result.sessionCount).toBe(2);
    expect(result.sessions.map((item) => item.id)).toEqual(["early", "late"]);
    expect(result.categoryDistribution).toEqual([
      { categoryId: "coordination", duration: 1_200, percentage: 67, sessionCount: 1 },
      { categoryId: "fundamentals", duration: 600, percentage: 33, sessionCount: 1 },
    ]);
  });

  it("builds annual category trends plus duration-based tags and combinations", () => {
    const result = calculateClassificationStatistics([
      session("january", new Date(2026, 0, 8, 9), 1_800, "fundamentals", ["timing", "speed"]),
      session("february", new Date(2026, 1, 12, 9), 1_200, "coordination", ["timing"]),
      session("future", new Date(2026, 7, 1, 9), 3_600, "song-practice", ["speed"]),
    ], { now: new Date(2026, 6, 5, 15), year: 2026 });

    expect(result.periodDuration).toBe(3_000);
    expect(result.categoryMonthlyDurations).toEqual([
      { categoryId: "fundamentals", duration: 1_800, month: 0 },
      { categoryId: "coordination", duration: 1_200, month: 1 },
    ]);
    expect(result.tagDistribution).toEqual([
      { duration: 3_000, percentage: 100, sessionCount: 2, tagId: "timing" },
      { duration: 1_800, percentage: 60, sessionCount: 1, tagId: "speed" },
    ]);
    expect(result.tagCombinations).toEqual([
      { duration: 1_800, percentage: 60, sessionCount: 1, tagIds: ["speed", "timing"] },
    ]);
  });
});
