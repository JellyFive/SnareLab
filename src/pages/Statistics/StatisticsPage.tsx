import { useEffect, useMemo, useState } from "react";

import { useAppShell } from "../../app/AppShellContext";
import { AppHeader } from "../../components/AppHeader";
import { CalendarHeatMap } from "../../components/CalendarHeatMap";
import { db, type SnareLabDatabase } from "../../database/dexie";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { calculateStatistics, type StatisticsPeriod, type StatisticsResult } from "../../services/statisticsService";
import type { Category, PracticeSession } from "../../types";

export interface StatisticsPageProps { database?: SnareLabDatabase; now?: Date; }

export function StatisticsPage({ database = db, now = new Date() }: StatisticsPageProps) {
  const { openSettings } = useAppShell();
  const [period, setPeriod] = useState<StatisticsPeriod>("week");
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string>();
  const sessionRepository = useMemo(() => new SessionRepository(database), [database]);

  useEffect(() => { void (async () => { try { const [nextSessions, nextCategories] = await Promise.all([sessionRepository.filterSessions({}), new CategoryRepository(database).findAll()]); setSessions(nextSessions); setCategories(nextCategories); setError(undefined); } catch { setError("Statistics could not be loaded. Try again."); } })(); }, [database]);

  const statistics = useMemo(() => calculateStatistics(sessions, { now, period }), [sessions, now, period]);

  return <section aria-labelledby="statistics-title" className="statistics-page"><AppHeader onOpenSettings={openSettings} title="统计" titleId="statistics-title" /><div aria-label="Statistics period" className="segmented-control"><button aria-pressed={period === "week"} className={period === "week" ? "segmented-control__tab segmented-control__tab--active" : "segmented-control__tab"} onClick={() => setPeriod("week")} type="button">This week</button><button aria-pressed={period === "month"} className={period === "month" ? "segmented-control__tab segmented-control__tab--active" : "segmented-control__tab"} onClick={() => setPeriod("month")} type="button">This month</button></div>{error && <p className="form-error" role="alert">{error}</p>}<StatGrid statistics={statistics} period={period} /><section className="statistics-section"><div className="statistics-section__header"><h2>Category distribution</h2><p>All practice</p></div><CategoryDistribution categories={categories} statistics={statistics} /></section><section className="statistics-section"><div className="statistics-section__header"><h2>Practice activity</h2><p>{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p></div><div className="calendar-panel"><CalendarHeatMap data={statistics.heatmap} mode="summary" month={now} /></div></section></section>;
}

function StatGrid({ period, statistics }: { period: StatisticsPeriod; statistics: StatisticsResult }) { return <div className="stat-grid"><StatCard label="Total practice" value={formatDuration(statistics.totalDuration)} /><StatCard label={period === "week" ? "This week" : "This month"} value={formatDuration(statistics.periodDuration)} /><StatCard label="Practice streak" value={`${statistics.currentStreak} ${statistics.currentStreak === 1 ? "day" : "days"}`} /><StatCard label="Sessions" value={`${statistics.sessionCount}`} /></div>; }
function StatCard({ label, value }: { label: string; value: string }) { return <article className="stat-card"><p>{label}</p><strong>{value}</strong></article>; }
function CategoryDistribution({ categories, statistics }: { categories: Category[]; statistics: StatisticsResult }) { if (!statistics.categoryDistribution.length) return <p className="empty-state">Practice sessions will appear here after you save them.</p>; const maximumDuration = statistics.categoryDistribution[0].duration; return <div className="distribution-list">{statistics.categoryDistribution.map((item) => { const category = categories.find((candidate) => candidate.id === item.categoryId); const name = category?.name ?? "Uncategorized"; return <article className="distribution-row" key={item.categoryId}><div className="distribution-row__label"><span className="distribution-row__dot" style={{ backgroundColor: category?.color ?? "#7B8492" }} /> <strong>{name}</strong><span>{formatDuration(item.duration)}</span></div><div aria-label={`${name} duration`} className="distribution-row__track"><span style={{ width: `${Math.round((item.duration / maximumDuration) * 100)}%` }} /></div></article>; })}</div>; }
function formatDuration(seconds: number): string { const hours = Math.floor(seconds / 3_600); const minutes = Math.floor((seconds % 3_600) / 60); return hours ? `${hours}h ${minutes}m` : `${minutes} min`; }
