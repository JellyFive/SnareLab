import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAppShell } from "../../app/AppShellContext";
import { AppHeader } from "../../components/AppHeader";
import { toDateKey } from "../../components/CalendarHeatMap";
import { FilterSheet } from "../../components/FilterSheet";
import { RecordBottomSheet } from "../../components/RecordBottomSheet";
import { db, type SnareLabDatabase } from "../../database/dexie";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import type { Category, LogFilter, PracticeSession, Tag } from "../../types";
import { displayCategory, displayTag } from "../../utils/classificationLabels";

export interface LogPageProps {
  database?: SnareLabDatabase;
}

export function LogPage({ database = db }: LogPageProps) {
  const { classificationRevision, openSettings } = useAppShell();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState<LogFilter>({});
  const [selectedSession, setSelectedSession] = useState<PracticeSession>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState<string>();

  const sessionRepository = useMemo(() => new SessionRepository(database), [database]);

  const reload = async (nextFilter = filter): Promise<PracticeSession[]> => {
    try {
      const [nextSessions, nextCategories, nextTags] = await Promise.all([
        sessionRepository.filterSessions(nextFilter),
        new CategoryRepository(database).findAll(),
        new TagRepository(database).findAll(),
      ]);
      setSessions(nextSessions);
      setCategories(nextCategories);
      setTags(nextTags);
      setError(undefined);
      return nextSessions;
    } catch {
      setError("练习记录加载失败，请重试。");
      return [];
    }
  };

  useEffect(() => { void reload(filter); }, [database, classificationRevision]);

  const groups = useMemo(() => groupSessionsByDate(sessions), [sessions]);
  const activeFilterCount = [filter.categoryIds?.length, filter.tagIds?.length].filter(Boolean).length;
  const hasActiveFilter = activeFilterCount > 0;
  const applyFilter = (nextFilter: LogFilter) => {
    setFilter(nextFilter);
    setFilterOpen(false);
    void reload(nextFilter);
  };
  const saveRecord = async (id: string, input: { attachments: PracticeSession["attachments"]; categoryId: string; tagIds: string[]; note?: string }) => {
    await sessionRepository.updateSessionMetadata(id, input);
    const updated = await sessionRepository.findById(id);
    setSelectedSession(updated);
    await reload();
  };
  const deleteRecord = async (id: string) => {
    await sessionRepository.deleteSession(id);
    setSelectedSession(undefined);
    await reload();
  };

  const filterButtonLabel = activeFilterCount ? `筛选练习记录（${activeFilterCount}）` : "筛选练习记录";

  return <section className="records-page" aria-labelledby="log-title"><AppHeader onOpenSettings={openSettings} title="记录" titleId="log-title" trailing={<button aria-label={filterButtonLabel} className="icon-button records-page__filter-button" onClick={() => setFilterOpen(true)} type="button"><SlidersHorizontal aria-hidden="true" size={20} />{activeFilterCount ? <span aria-hidden="true" className="records-page__filter-count">{activeFilterCount}</span> : null}</button>} />{error && <p className="form-error" role="alert">{error}</p>}{hasActiveFilter ? <div aria-label="当前筛选" className="records-page__filter-summary"><span>已筛选</span>{filter.categoryIds?.map((id) => <span className="tag-chip" key={id}>{displayCategory(categories.find((category) => category.id === id))}</span>)}{filter.tagIds?.map((id) => { const tag = tags.find((item) => item.id === id); return tag ? <span className="tag-chip" key={id}>{displayTag(tag)}</span> : null; })}{sessions.length ? <button className="records-page__clear-filter" onClick={() => applyFilter({})} type="button">清除筛选</button> : null}</div> : null}{sessions.length ? <div className="records-page__timeline" data-testid="record-timeline">{groups.map((group) => <section className="records-page__group" key={group.date}><header className="records-page__date-heading"><span>{formatWeekday(group.date)}</span><span aria-hidden="true" className="records-page__date-node" /><h2>{formatDateHeading(group.date)}</h2></header><div className="records-page__entries">{group.sessions.map((session) => <article className="records-page__entry" data-testid={`record-entry-${session.id}`} key={session.id}><time className="records-page__entry-time" dateTime={session.startTime.toISOString()}>{formatTime(session.startTime)}</time><span aria-hidden="true" className="records-page__time-node" /><RecordCard categories={categories} onOpen={() => setSelectedSession(session)} session={session} tags={tags} /></article>)}</div></section>)}</div> : <section className="records-page__empty"><h2>{hasActiveFilter ? "没有符合当前筛选条件的练习记录" : "还没有练习记录"}</h2><p>{hasActiveFilter ? "可以调整分类或标签筛选后再试。" : "完成一次练习后，记录会显示在这里。"}</p>{hasActiveFilter ? <button className="button button--secondary" onClick={() => applyFilter({})} type="button">清除筛选</button> : null}</section>}<FilterSheet categories={categories} filter={filter} onApply={applyFilter} onClose={() => setFilterOpen(false)} open={filterOpen} tags={tags} /><RecordBottomSheet categories={categories} onClose={() => setSelectedSession(undefined)} onDelete={deleteRecord} onSave={saveRecord} session={selectedSession} tags={tags} /></section>;
}

function RecordCard({ categories, onOpen, session, tags }: { categories: Category[]; onOpen: () => void; session: PracticeSession; tags: Tag[] }) {
  const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id)).slice(0, 2);
  const category = categories.find((item) => item.id === session.categoryId);
  const imageCount = session.attachments.length;

  return <button aria-label={`${displayCategory(category)} ${formatTime(session.startTime)} ${formatDuration(session.duration)}`} className="record-card" data-testid="record-card" onClick={onOpen} type="button"><span className="record-card__body"><span className="record-card__heading"><strong>{displayCategory(category)}</strong><span>{formatDuration(session.duration)}</span></span>{sessionTags.length ? <span className="chip-row">{sessionTags.map((tag) => <span className="tag-chip" key={tag.id}>{displayTag(tag)}</span>)}</span> : null}{session.note ? <span className="record-card__note">{session.note}</span> : null}</span>{imageCount ? <span className="record-card__images">图片 {imageCount} 张</span> : null}</button>;
}

function groupSessionsByDate(sessions: PracticeSession[]): Array<{ date: string; sessions: PracticeSession[] }> {
  const groups = new Map<string, PracticeSession[]>();
  [...sessions].sort((left, right) => right.startTime.getTime() - left.startTime.getTime()).forEach((session) => {
    const date = toDateKey(session.startTime);
    groups.set(date, [...(groups.get(date) ?? []), session]);
  });
  return [...groups.entries()].map(([date, groupedSessions]) => ({ date, sessions: groupedSessions }));
}

function formatDateHeading(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
}

function formatWeekday(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date(year, month - 1, day).getDay()];
}

function formatTime(date: Date): string { return date.toLocaleTimeString("zh-CN", { hour: "2-digit", hourCycle: "h23", minute: "2-digit" }); }
function formatDuration(seconds: number): string { const minutes = Math.floor(seconds / 60); const hours = Math.floor(minutes / 60); return hours ? `${hours} 小时 ${minutes % 60} 分钟` : `${minutes} 分钟`; }
