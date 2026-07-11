import { toDateKey, type CalendarHeatMapDatum } from "../components/CalendarHeatMap";
import type { PracticeSession } from "../types";

export type StatisticsPeriod = "week" | "month";

export interface CategoryDistributionItem {
  categoryId: string;
  duration: number;
  sessionCount: number;
}

export interface StatisticsResult {
  categoryDistribution: CategoryDistributionItem[];
  currentStreak: number;
  heatmap: CalendarHeatMapDatum[];
  periodDuration: number;
  sessionCount: number;
  totalDuration: number;
}

export function calculateStatistics(
  sessions: PracticeSession[],
  options: { now?: Date; period?: StatisticsPeriod } = {},
): StatisticsResult {
  const now = options.now ?? new Date();
  const period = options.period ?? "week";
  const periodStart = getPeriodStart(now, period);
  const totalDuration = sessions.reduce((total, session) => total + session.duration, 0);
  const periodSessions = sessions.filter((session) => session.startTime >= periodStart && session.startTime < nextDay(now));
  const heatmap = aggregateHeatmap(sessions, now.getFullYear(), now.getMonth());

  return {
    categoryDistribution: aggregateCategories(sessions),
    currentStreak: calculateCurrentStreak(sessions, now),
    heatmap,
    periodDuration: periodSessions.reduce((total, session) => total + session.duration, 0),
    sessionCount: sessions.length,
    totalDuration,
  };
}

function aggregateCategories(sessions: PracticeSession[]): CategoryDistributionItem[] {
  const summaries = new Map<string, CategoryDistributionItem>();
  sessions.forEach((session) => {
    const current = summaries.get(session.categoryId) ?? { categoryId: session.categoryId, duration: 0, sessionCount: 0 };
    current.duration += session.duration;
    current.sessionCount += 1;
    summaries.set(session.categoryId, current);
  });
  return [...summaries.values()].sort((left, right) => right.duration - left.duration);
}

function aggregateHeatmap(sessions: PracticeSession[], year: number, month: number): CalendarHeatMapDatum[] {
  const summaries = new Map<string, CalendarHeatMapDatum>();
  sessions.filter((session) => session.startTime.getFullYear() === year && session.startTime.getMonth() === month).forEach((session) => {
    const date = toDateKey(session.startTime);
    const current = summaries.get(date) ?? { date, duration: 0, sessionCount: 0 };
    current.duration += session.duration;
    current.sessionCount += 1;
    summaries.set(date, current);
  });
  return [...summaries.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function calculateCurrentStreak(sessions: PracticeSession[], now: Date): number {
  const practiceDays = new Set(sessions.map((session) => toDateKey(session.startTime)));
  let cursor = startOfDay(now);
  let streak = 0;
  while (practiceDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getPeriodStart(now: Date, period: StatisticsPeriod): Date {
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startOfDay(now);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function nextDay(date: Date): Date { const result = startOfDay(date); result.setDate(result.getDate() + 1); return result; }
function startOfDay(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
