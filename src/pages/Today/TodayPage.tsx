import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppShell } from "../../app/AppShellContext";
import { AppHeader } from "../../components/AppHeader";
import { CalendarHeatMap, toDateKey, type CalendarHeatMapDatum } from "../../components/CalendarHeatMap";
import { db, type SnareLabDatabase } from "../../database/dexie";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import { clearPendingSessionDraft, getPendingSessionDraft } from "../../services/pendingSessionDraftService";
import type { Category, PendingSessionDraft, PracticeSession, Tag } from "../../types";

export interface TodayPageProps {
  database?: SnareLabDatabase;
  initialDate?: Date;
}

export function TodayPage({ database = db, initialDate = new Date() }: TodayPageProps) {
  const navigate = useNavigate();
  const { openSettings } = useAppShell();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [draft, setDraft] = useState<PendingSessionDraft>();
  const [month, setMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const today = useMemo(() => startOfDay(initialDate), [initialDate]);

  useEffect(() => {
    void Promise.all([
      new SessionRepository(database).filterSessions({}),
      new CategoryRepository(database).findAll(),
      new TagRepository(database).findAll(),
      getPendingSessionDraft(database),
    ]).then(([nextSessions, nextCategories, nextTags, nextDraft]) => {
      setSessions(nextSessions);
      setCategories(nextCategories);
      setTags(nextTags);
      setDraft(nextDraft);
    });
  }, [database]);

  const todaySessions = sessions.filter((session) => isSameDay(session.startTime, today));
  const todayDuration = totalDuration(todaySessions);
  const allTimeDuration = totalDuration(sessions);
  const monthSessions = sessions.filter((session) => session.startTime.getFullYear() === month.getFullYear() && session.startTime.getMonth() === month.getMonth());
  const monthDuration = totalDuration(monthSessions);
  const monthDays = new Set(monthSessions.map((session) => toDateKey(session.startTime))).size;
  const heatmapData = aggregateHeatmap(monthSessions);

  const discardDraft = async () => {
    if (draft && !window.confirm("放弃后将无法恢复这条未保存的练习，确定继续吗？")) return;
    await clearPendingSessionDraft(database);
    setDraft(undefined);
  };

  return <section className="today-page" aria-labelledby="today-title"><AppHeader onOpenSettings={openSettings} title="Today" titleId="today-title" trailing={<p className="today-page__date">{formatShortDate(today)}</p>} />{draft && <aside className="draft-banner"><div><strong>有一条尚未保存的练习</strong><p>{formatDuration(draft.duration)}，可继续补充分类、标签和备注。</p></div><div className="draft-banner__actions"><button className="button" onClick={() => navigate("/timer", { state: { recoverDraft: true } })} type="button">继续保存</button><button className="button button--secondary" onClick={() => void discardDraft()} type="button">放弃草稿</button></div></aside>}<section aria-label="练习时长概览" className="today-summary"><article><span>今日练习时长</span><strong>{formatDuration(todayDuration)}</strong></article><article><span>总练习时长</span><strong>{formatDuration(allTimeDuration)}</strong></article></section><button aria-label="开始练习" className="button today-page__start" onClick={() => navigate("/timer")} type="button">开始练习</button><section className="today-month" aria-labelledby="today-month-title"><h2 id="today-month-title">本月练习</h2><div className="today-month__body"><article className="today-calendar"><div className="today-calendar__heading"><strong>{month.getMonth() + 1} 月</strong><div><button aria-label="上个月" className="icon-button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} type="button"><ChevronLeft aria-hidden="true" size={18} /></button><button aria-label="下个月" className="icon-button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} type="button"><ChevronRight aria-hidden="true" size={18} /></button></div></div><CalendarHeatMap data={heatmapData} mode="summary" month={month} weekStartsOnMonday /></article><aside aria-label="本月练习概览" className="today-month__summary"><span>本月练习</span><strong aria-label={`${monthDays} 天`} data-testid="month-practice-days">{monthDays}<small> 天</small></strong><p>累计 {formatDuration(monthDuration)}</p></aside></div></section><section className="today-records" aria-labelledby="today-records-title"><h2 id="today-records-title">今日练习记录</h2>{todaySessions.length === 0 ? <p className="today-page__empty">今天还没有练习记录</p> : <div className="today-record-list">{todaySessions.map((session) => <article className="today-record-card" key={session.id}><div className="today-record-card__heading"><strong>{displayCategory(categories.find((category) => category.id === session.categoryId))}</strong><span>{formatTime(session.startTime)} · {formatDuration(session.duration)}</span></div><div className="chip-row">{tags.filter((tag) => session.tagIds.includes(tag.id)).map((tag) => <span className="tag-chip" key={tag.id}>{displayTag(tag)}</span>)}</div>{session.note && <p className="today-record-card__note">{session.note}</p>}</article>)}</div>}</section></section>;
}

function aggregateHeatmap(sessions: PracticeSession[]): CalendarHeatMapDatum[] {
  const byDate = new Map<string, CalendarHeatMapDatum>();
  sessions.forEach((session) => {
    const date = toDateKey(session.startTime);
    const current = byDate.get(date) ?? { date, duration: 0, sessionCount: 0 };
    current.duration += session.duration;
    current.sessionCount += 1;
    byDate.set(date, current);
  });
  return [...byDate.values()];
}

function displayCategory(category: Category | undefined): string { return category ? ({ fundamentals: "基本功", coordination: "手脚协调", "song-practice": "曲目练习", "free-practice": "自由练习", uncategorized: "未分类" }[category.id] ?? category.name) : "未分类"; }
function displayTag(tag: Tag): string { return ({ "single-stroke": "单跳", "double-stroke": "双跳", paradiddle: "复合跳", rudiment: "基本功", groove: "律动", fill: "过门", timing: "节奏", dynamics: "力度", speed: "速度", control: "控制", independence: "独立性", reading: "视奏", endurance: "耐力", accuracy: "准确性" }[tag.id] ?? tag.name); }
function totalDuration(sessions: PracticeSession[]): number { return sessions.reduce((sum, session) => sum + session.duration, 0); }
function startOfDay(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function isSameDay(left: Date, right: Date): boolean { return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate(); }
function formatShortDate(date: Date): string { return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function formatTime(date: Date): string { return date.toLocaleTimeString("zh-CN", { hour: "2-digit", hour12: false, minute: "2-digit" }); }
function formatDuration(seconds: number): string { const hours = Math.floor(seconds / 3_600); const minutes = Math.floor((seconds % 3_600) / 60); if (hours > 0 && minutes > 0) return `${hours} 小时 ${minutes} 分钟`; if (hours > 0) return `${hours} 小时`; return `${minutes} 分钟`; }
