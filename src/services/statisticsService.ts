import { toDateKey, type CalendarHeatMapDatum } from "../components/CalendarHeatMap";
import type { PracticeSession } from "../types";

// "week" remains available while the v0.2 statistics screen is replaced in Task 10.
export type StatisticsPeriod = "week" | "month" | "year";

export interface CategoryDistributionItem {
  categoryId: string;
  duration: number;
  percentage: number;
  sessionCount: number;
}

export interface TagDistributionItem {
  duration: number;
  percentage: number;
  sessionCount: number;
  tagId: string;
}

export interface CategoryMonthlyDuration {
  categoryId: string;
  duration: number;
  month: number;
}

export interface TagCombinationItem {
  duration: number;
  percentage: number;
  sessionCount: number;
  tagIds: string[];
}

export interface ClassificationStatisticsResult {
  categoryDistribution: CategoryDistributionItem[];
  categoryMonthlyDurations: CategoryMonthlyDuration[];
  periodDuration: number;
  tagCombinations: TagCombinationItem[];
  tagDistribution: TagDistributionItem[];
}

export interface StatisticsResult {
  categoryDistribution: CategoryDistributionItem[];
  currentStreak: number;
  heatmap: CalendarHeatMapDatum[];
  periodDuration: number;
  sessionCount: number;
  tagDistribution: TagDistributionItem[];
  todayDuration: number;
  totalDuration: number;
}

export interface MonthSummary {
  duration: number;
  month: number;
  practiceDays: number;
  sessionCount: number;
  year: number;
}

export interface DayStatistics {
  categoryDistribution: CategoryDistributionItem[];
  duration: number;
  sessionCount: number;
  sessions: PracticeSession[];
}

export function calculateStatistics(
  sessions: PracticeSession[],
  options: { now?: Date; period?: StatisticsPeriod; periodDate?: Date } = {},
): StatisticsResult {
  const now = options.now ?? new Date();
  const period = options.period ?? "week";
  const periodDate = options.periodDate ?? now;
  const periodSessions = filterCurrentPeriod(sessions, now, periodDate, period);
  const todaySessions = filterDay(sessions, now);

  return {
    categoryDistribution: aggregateCategories(periodSessions),
    currentStreak: calculateCurrentStreak(sessions, now),
    heatmap: aggregateHeatmap(periodSessions),
    periodDuration: sumDurations(periodSessions),
    sessionCount: sessions.length,
    tagDistribution: aggregateTags(periodSessions, sumDurations(periodSessions)),
    todayDuration: sumDurations(todaySessions),
    totalDuration: sumDurations(sessions),
  };
}

export function calculateClassificationStatistics(
  sessions: PracticeSession[],
  options: { now?: Date; year: number },
): ClassificationStatisticsResult {
  const now = options.now ?? new Date();
  const periodSessions = filterCurrentPeriod(sessions, now, new Date(options.year, 0, 1), "year");
  const periodDuration = sumDurations(periodSessions);

  return {
    categoryDistribution: aggregateCategories(periodSessions),
    categoryMonthlyDurations: aggregateCategoryMonthlyDurations(periodSessions),
    periodDuration,
    tagCombinations: aggregateTagCombinations(periodSessions, periodDuration),
    tagDistribution: aggregateTags(periodSessions, periodDuration),
  };
}

export function calculateMonthSummaries(sessions: PracticeSession[], year: number, now = new Date()): MonthSummary[] {
  return Array.from({ length: 12 }, (_, month) => {
    const start = new Date(year, month, 1);
    const end = new Date(Math.min(new Date(year, month + 1, 1).getTime(), nextDay(now).getTime()));
    const monthSessions = sessions.filter((session) => session.startTime >= start && session.startTime < end);
    return { duration: sumDurations(monthSessions), month, practiceDays: new Set(monthSessions.map((session) => toDateKey(session.startTime))).size, sessionCount: monthSessions.length, year };
  });
}

export function listMonthPracticeSessions(sessions: PracticeSession[], date: Date, now = new Date()): PracticeSession[] {
  return filterCurrentPeriod(sessions, now, date, "month")
    .sort((left, right) => right.startTime.getTime() - left.startTime.getTime());
}

export function calculateDayStatistics(sessions: PracticeSession[], date: Date): DayStatistics {
  const daySessions = filterDay(sessions, date).sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
  return { categoryDistribution: aggregateCategories(daySessions), duration: sumDurations(daySessions), sessionCount: daySessions.length, sessions: daySessions };
}

function filterCurrentPeriod(sessions: PracticeSession[], now: Date, periodDate: Date, period: StatisticsPeriod): PracticeSession[] {
  const start = getPeriodStart(periodDate, period);
  const end = new Date(Math.min(getPeriodEnd(periodDate, period).getTime(), nextDay(now).getTime()));
  return sessions.filter((session) => session.startTime >= start && session.startTime < end);
}

function filterDay(sessions: PracticeSession[], date: Date): PracticeSession[] {
  const start = startOfDay(date);
  const end = nextDay(date);
  return sessions.filter((session) => session.startTime >= start && session.startTime < end);
}

function aggregateCategories(sessions: PracticeSession[]): CategoryDistributionItem[] {
  const summaries = new Map<string, Omit<CategoryDistributionItem, "percentage">>();
  sessions.forEach((session) => {
    const current = summaries.get(session.categoryId) ?? { categoryId: session.categoryId, duration: 0, sessionCount: 0 };
    current.duration += session.duration;
    current.sessionCount += 1;
    summaries.set(session.categoryId, current);
  });
  const items = [...summaries.values()].sort((left, right) => right.duration - left.duration || left.categoryId.localeCompare(right.categoryId));
  return applyPercentages(items, (item) => item.duration).map((item) => ({ ...item, percentage: item.percentage }));
}

function aggregateTags(sessions: PracticeSession[], periodDuration: number): TagDistributionItem[] {
  const summaries = new Map<string, Omit<TagDistributionItem, "percentage">>();
  sessions.forEach((session) => {
    session.tagIds.forEach((tagId) => {
      const current = summaries.get(tagId) ?? { duration: 0, sessionCount: 0, tagId };
      current.duration += session.duration;
      current.sessionCount += 1;
      summaries.set(tagId, current);
    });
  });
  const items = [...summaries.values()]
    .sort((left, right) => right.duration - left.duration || left.tagId.localeCompare(right.tagId));
  return applyReferencePercentages(items, periodDuration, (item) => item.duration);
}

function aggregateCategoryMonthlyDurations(sessions: PracticeSession[]): CategoryMonthlyDuration[] {
  const summaries = new Map<string, CategoryMonthlyDuration>();
  sessions.forEach((session) => {
    const month = session.startTime.getMonth();
    const key = `${month}:${session.categoryId}`;
    const current = summaries.get(key) ?? { categoryId: session.categoryId, duration: 0, month };
    current.duration += session.duration;
    summaries.set(key, current);
  });
  return [...summaries.values()].sort((left, right) => left.month - right.month || left.categoryId.localeCompare(right.categoryId));
}

function aggregateTagCombinations(sessions: PracticeSession[], periodDuration: number): TagCombinationItem[] {
  const summaries = new Map<string, Omit<TagCombinationItem, "percentage">>();
  sessions.filter((session) => session.tagIds.length > 1).forEach((session) => {
    const tagIds = [...session.tagIds].sort();
    const key = tagIds.join("|");
    const current = summaries.get(key) ?? { duration: 0, sessionCount: 0, tagIds };
    current.duration += session.duration;
    current.sessionCount += 1;
    summaries.set(key, current);
  });
  const items = [...summaries.values()]
    .sort((left, right) => right.duration - left.duration || left.tagIds.join("|").localeCompare(right.tagIds.join("|")));
  return applyReferencePercentages(items, periodDuration, (item) => item.duration);
}

function applyPercentages<T>(items: T[], getValue: (item: T) => number): Array<T & { percentage: number }> {
  const total = items.reduce((sum, item) => sum + getValue(item), 0);
  if (!total) return items.map((item) => ({ ...item, percentage: 0 }));

  const entries = items.map((item, index) => {
    const exact = (getValue(item) / total) * 100;
    const percentage = Math.floor(exact);
    return { index, percentage, remainder: exact - percentage };
  });
  let remaining = 100 - entries.reduce((sum, entry) => sum + entry.percentage, 0);
  entries
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index)
    .forEach((entry) => {
      if (remaining > 0) {
        entry.percentage += 1;
        remaining -= 1;
      }
    });
  const percentages = new Map(entries.map((entry) => [entry.index, entry.percentage]));
  return items.map((item, index) => ({ ...item, percentage: percentages.get(index) ?? 0 }));
}

function applyReferencePercentages<T>(items: T[], reference: number, getValue: (item: T) => number): Array<T & { percentage: number }> {
  if (!reference) return items.map((item) => ({ ...item, percentage: 0 }));
  return items.map((item) => ({ ...item, percentage: Math.round((getValue(item) / reference) * 100) }));
}

function aggregateHeatmap(sessions: PracticeSession[]): CalendarHeatMapDatum[] {
  const summaries = new Map<string, CalendarHeatMapDatum>();
  sessions.forEach((session) => {
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
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startOfDay(now);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function getPeriodEnd(date: Date, period: StatisticsPeriod): Date {
  if (period === "year") return new Date(date.getFullYear() + 1, 0, 1);
  if (period === "month") return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const start = getPeriodStart(date, period);
  start.setDate(start.getDate() + 7);
  return start;
}

function sumDurations(sessions: PracticeSession[]): number { return sessions.reduce((total, session) => total + session.duration, 0); }
function nextDay(date: Date): Date { const result = startOfDay(date); result.setDate(result.getDate() + 1); return result; }
function startOfDay(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
