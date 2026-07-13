import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAppShell } from "../../app/AppShellContext";
import { AnnualHeatMap } from "../../components/AnnualHeatMap";
import { AppHeader } from "../../components/AppHeader";
import { CalendarHeatMap } from "../../components/CalendarHeatMap";
import { DistributionDonut, type DistributionDonutItem } from "../../components/DistributionDonut";
import { RecordBottomSheet } from "../../components/RecordBottomSheet";
import { db, type SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import { calculateClassificationStatistics, calculateDayStatistics, calculateMonthSummaries, calculateStatistics, listMonthPracticeSessions } from "../../services/statisticsService";
import type { Category, PracticeSession, Tag } from "../../types";
import { displayCategory, displayTag } from "../../utils/classificationLabels";

export interface StatisticsPageProps { database?: SnareLabDatabase; now?: Date; }
type DetailView = { kind: "overview" } | { kind: "month"; date: Date } | { kind: "day"; date: Date };
type StatisticsTab = "overview" | "categories" | "tags";

export function StatisticsPage({ database = db, now = new Date() }: StatisticsPageProps) {
  const { classificationRevision, openSettings } = useAppShell();
  const [activeTab, setActiveTab] = useState<StatisticsTab>("overview");
  const [view, setView] = useState<DetailView>({ kind: "overview" });
  const [year, setYear] = useState(now.getFullYear());
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedSession, setSelectedSession] = useState<PracticeSession>();
  const [error, setError] = useState<string>();
  const sessionRepository = useMemo(() => new SessionRepository(database), [database]);

  const reload = async () => {
    try {
      await Promise.all([ensureDefaultCategories(database), ensurePresetTags(database)]);
      const [nextSessions, nextCategories, nextTags] = await Promise.all([sessionRepository.filterSessions({}), new CategoryRepository(database).findAll(), new TagRepository(database).findAll()]);
      setSessions(nextSessions); setCategories(nextCategories); setTags(nextTags); setError(undefined);
    } catch { setError("统计数据加载失败，请稍后重试。"); }
  };
  useEffect(() => { void reload(); }, [database, classificationRevision, sessionRepository]);

  const annual = useMemo(() => calculateStatistics(sessions, { now, period: "year", periodDate: new Date(year, 0, 1) }), [now, sessions, year]);
  const classifications = useMemo(() => calculateClassificationStatistics(sessions, { now, year }), [now, sessions, year]);
  const monthSummaries = useMemo(() => calculateMonthSummaries(sessions, year, now), [now, sessions, year]);
  const month = view.kind === "month" ? calculateStatistics(sessions, { now, period: "month", periodDate: view.date }) : undefined;
  const monthSessions = useMemo(() => view.kind === "month" ? listMonthPracticeSessions(sessions, view.date, now) : [], [now, sessions, view]);
  const day = view.kind === "day" ? calculateDayStatistics(sessions, view.date) : undefined;

  const saveRecord = async (id: string, input: { attachments: PracticeSession["attachments"]; categoryId: string; note?: string; tagIds: string[] }) => { await sessionRepository.updateSessionMetadata(id, input); await reload(); setSelectedSession(await sessionRepository.findById(id)); };
  const deleteRecord = async (id: string) => { await sessionRepository.deleteSession(id); setSelectedSession(undefined); await reload(); };

  const returnFromDetail = () => {
    if (view.kind === "day") {
      setView({ kind: "month", date: new Date(view.date.getFullYear(), view.date.getMonth(), 1) });
      return;
    }
    setView({ kind: "overview" });
  };

  const isOverviewDetail = activeTab === "overview" && view.kind !== "overview";
  const title = isOverviewDetail ? view.kind === "month" ? `${view.date.getFullYear()}年${view.date.getMonth() + 1}月` : formatDetailDate(view.date) : "统计";
  const changeTab = (tab: StatisticsTab) => { setActiveTab(tab); if (tab === "overview") setView({ kind: "overview" }); };

  return <section aria-labelledby="statistics-title" className="statistics-page statistics-page--v3">
    <AppHeader centeredTitle={isOverviewDetail} leading={isOverviewDetail ? <button aria-label="返回上一级" className="icon-button" onClick={returnFromDetail} type="button"><ChevronLeft aria-hidden="true" size={21} /></button> : undefined} onOpenSettings={openSettings} title={title} titleAccessory={view.kind === "month" ? <ChevronDown aria-hidden="true" size={16} strokeWidth={2.5} /> : undefined} titleId="statistics-title" />
    {!isOverviewDetail && <div aria-label="统计视图" className="statistics-period-control"><button aria-pressed={activeTab === "overview"} className={activeTab === "overview" ? "is-active" : ""} onClick={() => changeTab("overview")} type="button">概览</button><button aria-pressed={activeTab === "categories"} className={activeTab === "categories" ? "is-active" : ""} onClick={() => changeTab("categories")} type="button">分类</button><button aria-pressed={activeTab === "tags"} className={activeTab === "tags" ? "is-active" : ""} onClick={() => changeTab("tags")} type="button">标签</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {activeTab === "overview" && view.kind === "overview" && <Overview annual={annual} monthSummaries={monthSummaries} now={now} onMonth={(month) => setView({ kind: "month", date: new Date(year, month, 1) })} onYear={setYear} year={year} />}
    {activeTab === "overview" && view.kind === "month" && month && <MonthDetail categories={categories} date={view.date} month={month} onDay={(date) => setView({ kind: "day", date })} onOpen={setSelectedSession} sessions={monthSessions} />}
    {activeTab === "overview" && view.kind === "day" && day && <DayDetail categories={categories} day={day} onOpen={setSelectedSession} date={view.date} />}
    {activeTab === "categories" && <CategoryAnalysis categories={categories} onYear={setYear} statistics={classifications} year={year} />}
    {activeTab === "tags" && <TagAnalysis onYear={setYear} statistics={classifications} tags={tags} year={year} />}
    <RecordBottomSheet categories={categories} onClose={() => setSelectedSession(undefined)} onDelete={deleteRecord} onSave={saveRecord} session={selectedSession} tags={tags} />
  </section>;
}

function Overview({ annual, monthSummaries, now, onMonth, onYear, year }: { annual: ReturnType<typeof calculateStatistics>; monthSummaries: ReturnType<typeof calculateMonthSummaries>; now: Date; onMonth: (month: number) => void; onYear: (year: number) => void; year: number }) {
  const practiceDays = new Set(annual.heatmap.map((item) => item.date)).size;
  const sessionCount = annual.heatmap.reduce((sum, item) => sum + item.sessionCount, 0);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const latestMonth = year === now.getFullYear() ? now.getMonth() : 11;
  const orderedMonths = [...monthSummaries.filter((item) => item.month <= latestMonth)].reverse();
  const visibleMonths = showAllMonths ? orderedMonths : orderedMonths.slice(0, 5);

  return <>
    <section aria-label="年度选择" className="statistics-overview-year-control">
      <CalendarDays aria-hidden="true" size={18} />
      <button aria-label="上一年" className="statistics-overview-year-control__button" onClick={() => onYear(year - 1)} type="button"><ChevronLeft aria-hidden="true" size={17} /></button>
      <strong>{year} 年</strong>
      <button aria-label="下一年" className="statistics-overview-year-control__button" onClick={() => onYear(year + 1)} type="button"><ChevronRight aria-hidden="true" size={17} /></button>
    </section>
    <section aria-label="年度练习概览" className="statistics-summary-grid statistics-annual-metrics">
      <Metric label="总练习时长" value={formatDuration(annual.periodDuration)} />
      <Metric label="练习天数" value={`${practiceDays} 天`} />
      <Metric label="连续练习" value={`${annual.currentStreak} 天`} />
      <Metric label="练习次数" value={`${sessionCount} 次`} />
    </section>
    <section className="statistics-section statistics-section--annual-heatmap">
      <div className="statistics-section__header"><h2>年度练习热力图</h2><p>{year} 年</p></div>
      <div className="statistics-year-panel"><AnnualHeatMap data={annual.heatmap} year={year} /></div>
    </section>
    <section className="statistics-section">
      <div className="statistics-section__header"><h2>月份总结</h2><p>点击查看详情</p></div>
      <div className="statistics-month-list">
        {visibleMonths.map((item) => <button aria-label={`${item.month + 1} 月${item.practiceDays} 天练习${formatDuration(item.duration)}${item.sessionCount} 次练习`} className="statistics-month-summary statistics-month-summary--annual" disabled={!item.sessionCount} key={item.month} onClick={() => onMonth(item.month)} type="button">
          <strong>{item.month + 1} 月</strong>
          <MonthActivityStrip heatmap={annual.heatmap} month={item.month} />
          <span className="statistics-month-summary__details"><b>{item.practiceDays} 天练习</b><b>{formatDuration(item.duration)}</b><small>{item.sessionCount} 次</small></span>
          <ChevronRight aria-hidden="true" size={18} />
        </button>)}
      </div>
      {orderedMonths.length > 5 && <button className="statistics-month-list__more" onClick={() => setShowAllMonths((current) => !current)} type="button">{showAllMonths ? "收起月份" : "查看更多月份"}<ChevronRight aria-hidden="true" size={16} /></button>}
    </section>
  </>;
}

function MonthActivityStrip({ heatmap, month }: { heatmap: ReturnType<typeof calculateStatistics>["heatmap"]; month: number }) {
  const durations = Array.from({ length: 16 }, (_, index) => {
    const start = Math.floor((index * 31) / 16) + 1;
    const end = Math.floor(((index + 1) * 31) / 16) + 1;
    return heatmap.filter((item) => {
      const date = dateFromKey(item.date);
      return date.getMonth() === month && date.getDate() >= start && date.getDate() < end;
    }).reduce((sum, item) => sum + item.duration, 0);
  });
  const maximum = Math.max(...durations, 0);

  return <span aria-hidden="true" className="statistics-month-activity-strip">{durations.map((duration, index) => <i className={`statistics-month-activity-strip__cell statistics-month-activity-strip__cell--${intensityForDuration(duration, maximum)}`} key={index} />)}</span>;
}

function MonthDetail({ categories, date, month, onDay, onOpen, sessions }: { categories: Category[]; date: Date; month: ReturnType<typeof calculateStatistics>; onDay: (date: Date) => void; onOpen: (session: PracticeSession) => void; sessions: PracticeSession[] }) {
  return <>
    <section className="statistics-section statistics-section--month-calendar">
      <div className="statistics-section__header"><h2>日历热力图</h2><p>按日时长</p></div>
      <div className="statistics-month-panel statistics-month-panel--detail">
        <CalendarHeatMap data={month.heatmap} labelStyle="chinese" mode="navigation" month={date} onSelectDate={(key) => onDay(dateFromKey(key))} showDuration weekStartsOnMonday />
        <div className="statistics-month-panel__legend"><span>无练习</span><i /><i /><i /><i /><span>高强度</span></div>
      </div>
    </section>
    <section className="statistics-section">
      <div className="statistics-section__header"><h2>分类分布</h2><p>按时长</p></div>
      <DistributionDonut centerLabel="总时长" centerValue={formatDuration(month.periodDuration)} compact emptyMessage="本月还没有分类练习数据" items={categoryItems(month.categoryDistribution, categories)} showTracks={false} />
    </section>
    <section className="statistics-section">
      <div className="statistics-section__header"><h2>近期练习记录</h2><p>本月最近</p></div>
      {sessions.length ? <div className="statistics-month-records">{sessions.slice(0, 3).map((session) => <button className="statistics-month-record" key={session.id} onClick={() => onOpen(session)} type="button"><time>{formatMonthDay(session.startTime)}</time><span><strong>{displayCategory(categories.find((item) => item.id === session.categoryId))}</strong><small>{formatTime(session.startTime)} · {formatDuration(session.duration)}</small></span><ChevronRight aria-hidden="true" size={17} /></button>)}</div> : <p className="statistics-empty-state">本月还没有练习记录</p>}
    </section>
  </>;
}

function DayDetail({ categories, date, day, onOpen }: { categories: Category[]; date: Date; day: ReturnType<typeof calculateDayStatistics>; onOpen: (session: PracticeSession) => void }) {
  return <>
    <section aria-label="当天练习概览" className="statistics-summary-grid statistics-day-metrics">
      <Metric label="练习时长" value={formatDuration(day.duration)} />
      <Metric label="练习次数" value={`${day.sessionCount} 次`} />
      <Metric label="分类数量" value={`${day.categoryDistribution.length} 类`} />
    </section>
    <section className="statistics-section">
      <div className="statistics-section__header"><h2>练习记录</h2><p>{formatDetailDate(date)}</p></div>
      {day.sessions.length ? <div className="statistics-day-list">{day.sessions.map((session) => <button className="statistics-day-record statistics-day-record--detail" key={session.id} onClick={() => onOpen(session)} type="button"><time>{formatTime(session.startTime)}</time><span><strong>{displayCategory(categories.find((item) => item.id === session.categoryId))}</strong><small>{formatDuration(session.duration)}</small></span><ChevronRight aria-hidden="true" size={18} /></button>)}</div> : <p className="statistics-empty-state">当天还没有练习记录</p>}
    </section>
    <section className="statistics-section">
      <div className="statistics-section__header"><h2>分类分布</h2><p>按时长</p></div>
      <DistributionDonut centerLabel="当天时长" centerValue={formatDuration(day.duration)} compact emptyMessage="当天还没有分类练习数据" items={categoryItems(day.categoryDistribution, categories)} showTracks={false} />
    </section>
  </>;
}

function CategoryAnalysis({ categories, onYear, statistics, year }: { categories: Category[]; onYear: (year: number) => void; statistics: ReturnType<typeof calculateClassificationStatistics>; year: number }) {
  const items = categoryItems(statistics.categoryDistribution, categories);
  const ranking = items.map((item) => ({ ...item, sessionCount: statistics.categoryDistribution.find((entry) => entry.categoryId === item.id)?.sessionCount ?? 0 }));
  return <><StatisticsYearControl onYear={onYear} year={year} /><section className="statistics-section"><div className="statistics-section__header"><h2>分类时长分布</h2><p>按练习时长</p></div><DistributionDonut centerLabel="年度时长" centerValue={formatDuration(statistics.periodDuration)} emptyMessage="本年还没有分类练习数据" items={items} /></section><section className="statistics-section"><div className="statistics-section__header"><h2>各月练习时长</h2><p>按分类</p></div><CategoryMonthlyTrend categories={categories} data={statistics.categoryMonthlyDurations} /></section><section className="statistics-section"><div className="statistics-section__header"><h2>分类明细</h2><p>{year} 年</p></div><DurationRanking emptyMessage="本年还没有分类练习数据" items={ranking} /></section></>;
}

function TagAnalysis({ onYear, statistics, tags, year }: { onYear: (year: number) => void; statistics: ReturnType<typeof calculateClassificationStatistics>; tags: Tag[]; year: number }) {
  const items = statistics.tagDistribution.map((item) => {
    const tag = tags.find((candidate) => candidate.id === item.tagId) ?? fallbackTag(item.tagId);
    return { color: tagColor(tag), id: item.tagId, label: displayTag(tag), percentage: item.percentage, sessionCount: item.sessionCount, value: formatDuration(item.duration) };
  });
  return <><StatisticsYearControl onYear={onYear} year={year} /><section className="statistics-section"><div className="statistics-section__header"><h2>标签时长排行</h2><p>按练习时长</p></div><DurationRanking emptyMessage="本年还没有标签练习数据" items={items} /></section><section className="statistics-section"><div className="statistics-section__header"><h2>标签组合分析</h2><p>多标签记录</p></div>{statistics.tagCombinations.length ? <div className="statistics-combination-list">{statistics.tagCombinations.map((item) => <article className="statistics-combination" key={item.tagIds.join("|")}><strong>{item.tagIds.map((id) => displayTag(tags.find((tag) => tag.id === id) ?? fallbackTag(id))).join(" + ")}</strong><span>{formatDuration(item.duration)} · {item.percentage}% · {item.sessionCount} 条记录</span></article>)}</div> : <p className="statistics-empty-state">本年还没有多标签练习记录</p>}</section></>;
}

function StatisticsYearControl({ onYear, year }: { onYear: (year: number) => void; year: number }) { return <section aria-label="统计年份" className="statistics-year-selector"><button aria-label="上一年" className="statistics-month-panel__button" onClick={() => onYear(year - 1)} type="button"><ChevronLeft aria-hidden="true" size={18} /></button><strong>{year} 年统计</strong><button aria-label="下一年" className="statistics-month-panel__button" onClick={() => onYear(year + 1)} type="button"><ChevronRight aria-hidden="true" size={18} /></button></section>; }

function DurationRanking({ emptyMessage, items }: { emptyMessage: string; items: Array<DistributionDonutItem & { id: string; sessionCount: number }> }) { if (!items.length) return <p className="statistics-empty-state">{emptyMessage}</p>; return <div className="statistics-ranking">{items.map((item, index) => <article className="statistics-ranking__item" key={item.id}><div><span className="statistics-ranking__index">{index + 1}</span><span className="distribution-card__dot" style={{ backgroundColor: item.color }} /><strong>{item.label}</strong><span>{item.value}</span><b>{item.percentage}%</b></div><div aria-label={`${item.label} 占本年度练习时长 ${item.percentage}%`} className="distribution-card__track"><span style={{ backgroundColor: item.color, width: `${Math.min(item.percentage, 100)}%` }} /></div><small>{item.sessionCount} 条练习记录</small></article>)}</div>; }

function CategoryMonthlyTrend({ categories, data }: { categories: Category[]; data: ReturnType<typeof calculateClassificationStatistics>["categoryMonthlyDurations"] }) { if (!data.length) return <p className="statistics-empty-state">本年还没有分类练习趋势</p>; const max = Math.max(...Array.from({ length: 12 }, (_, month) => data.filter((item) => item.month === month).reduce((total, item) => total + item.duration, 0))); return <article aria-label="按月分类练习时长" className="statistics-trend">{Array.from({ length: 12 }, (_, month) => <div className="statistics-trend__month" key={month}><div>{data.filter((item) => item.month === month).map((item) => <span aria-label={`${month + 1} 月${displayCategory(categories.find((category) => category.id === item.categoryId))}${formatDuration(item.duration)}`} key={item.categoryId} style={{ backgroundColor: categories.find((category) => category.id === item.categoryId)?.color ?? "#7B8492", height: `${max ? Math.max(8, (item.duration / max) * 100) : 0}%` }} />)}</div><small>{month + 1} 月</small></div>)}</article>; }

function Metric({ label, value }: { label: string; value: string }) { return <article className="statistics-metric"><span>{label}</span><strong>{value}</strong></article>; }
function categoryItems(items: Array<{ categoryId: string; duration: number; percentage: number }>, categories: Category[]): Array<DistributionDonutItem & { id: string }> { return items.map((item) => { const category = categories.find((candidate) => candidate.id === item.categoryId); return { color: category?.color ?? "#7B8492", id: item.categoryId, label: displayCategory(category), percentage: item.percentage, value: formatDuration(item.duration) }; }); }
function dateFromKey(value: string): Date { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); }
function formatDate(date: Date): string { return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`; }
function formatDetailDate(date: Date): string { return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]}`; }
function formatMonthDay(date: Date): string { return `${date.getMonth() + 1}月${date.getDate()}日`; }
function formatTime(date: Date): string { return date.toLocaleTimeString("zh-CN", { hour: "2-digit", hourCycle: "h23", minute: "2-digit" }); }
function formatDuration(seconds: number): string { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return hours ? `${hours} 小时${minutes ? ` ${minutes} 分` : ""}` : `${minutes} 分`; }
function intensityForDuration(duration: number, maximum: number): number { return duration <= 0 || maximum <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((duration / maximum) * 4))); }
function fallbackTag(id: string): Tag { return { color: undefined, createdAt: new Date(0), id, isPreset: false, name: id, updatedAt: new Date(0) }; }
function tagColor(tag: Tag): string { if (tag.color) return tag.color; const colors = ["#7F72DE", "#5D9FA0", "#D184A7", "#C99C45"]; return colors[[...tag.id].reduce((total, char) => total + char.charCodeAt(0), 0) % colors.length]; }
