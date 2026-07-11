import { useEffect, useMemo, useState } from "react";

import { CalendarHeatMap, toDateKey } from "../../components/CalendarHeatMap";
import { FilterSheet } from "../../components/FilterSheet";
import { RecordBottomSheet } from "../../components/RecordBottomSheet";
import { db, type SnareLabDatabase } from "../../database/dexie";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import type { Category, LogFilter, PracticeSession, Tag } from "../../types";

export interface LogPageProps {
  database?: SnareLabDatabase;
  initialMonth?: Date;
}

export function LogPage({ database = db, initialMonth = new Date() }: LogPageProps) {
  const [month, setMonth] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState<LogFilter>({});
  const [selectedDate, setSelectedDate] = useState<string>();
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
      setError("Practice records could not be loaded. Try again.");
      return [];
    }
  };

  useEffect(() => { void reload({}); }, [database]);

  const calendarData = useMemo(() => {
    const byDate = new Map<string, { date: string; duration: number; sessionCount: number }>();
    sessions.forEach((session) => {
      const date = toDateKey(session.startTime);
      const current = byDate.get(date) ?? { date, duration: 0, sessionCount: 0 };
      current.duration += session.duration;
      current.sessionCount += 1;
      byDate.set(date, current);
    });
    return [...byDate.values()];
  }, [sessions]);
  const selectedSessions = selectedDate ? sessions.filter((session) => toDateKey(session.startTime) === selectedDate) : [];
  const selectedTotal = selectedSessions.reduce((total, session) => total + session.duration, 0);
  const activeFilterCount = [filter.categoryIds?.length, filter.tagIds?.length, filter.startDate || filter.endDate ? 1 : 0, filter.minDuration !== undefined || filter.maxDuration !== undefined ? 1 : 0].filter(Boolean).length;

  const selectMonth = (offset: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(undefined);
  };
  const applyFilter = (nextFilter: LogFilter) => {
    setFilter(nextFilter);
    setFilterOpen(false);
    void reload(nextFilter).then((nextSessions) => {
      setSelectedDate(nextSessions[0] ? toDateKey(nextSessions[0].startTime) : undefined);
    });
  };
  const saveRecord = async (id: string, input: { categoryId: string; tagIds: string[]; note?: string }) => {
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

  return <section className="log-page" aria-labelledby="log-title"><header className="page-header"><div><p className="page-header__product">SnareLab</p><h1 id="log-title">Log</h1></div><button aria-label="Filter practice log" className="button button--secondary" onClick={() => setFilterOpen(true)} type="button">Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}</button></header><section className="calendar-panel"><div className="month-switcher"><button aria-label="Previous month" className="icon-button" onClick={() => selectMonth(-1)} type="button">Previous</button><h2>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2><button aria-label="Next month" className="icon-button" onClick={() => selectMonth(1)} type="button">Next</button></div><CalendarHeatMap data={calendarData} mode="navigation" month={month} onSelectDate={setSelectedDate} selectedDate={selectedDate} /></section>{error && <p className="form-error" role="alert">{error}</p>}{selectedDate ? <section className="selected-day"><div className="selected-day__heading"><h2>{formatSelectedDay(selectedDate)}</h2><p>{selectedSessions.length} {selectedSessions.length === 1 ? "session" : "sessions"} · {formatMinutes(selectedTotal)}</p></div>{selectedSessions.length ? <div className="record-list">{selectedSessions.map((session) => <button className="record-card" key={session.id} onClick={() => setSelectedSession(session)} type="button"><span className="record-card__accent" style={{ backgroundColor: categories.find((category) => category.id === session.categoryId)?.color }} /><span className="record-card__body"><strong>{categories.find((category) => category.id === session.categoryId)?.name ?? "Uncategorized"}</strong><span>{formatTime(session.startTime)} · {formatDuration(session.duration)}</span>{session.note && <span>{session.note}</span>}</span><span className="record-card__tags">{tags.filter((tag) => session.tagIds.includes(tag.id)).slice(0, 2).map((tag) => tag.name).join(" · ")}</span></button>)}</div> : <p className="empty-state">No records match these filters.</p>}</section> : <section className="log-page__empty"><h2>{sessions.length ? "Choose a day" : "No practice records this month."}</h2><p>{sessions.length ? "Select a day in the calendar to review its records." : "Start from Today to record your next practice session."}</p></section>}<FilterSheet categories={categories} filter={filter} onApply={applyFilter} onClose={() => setFilterOpen(false)} open={filterOpen} tags={tags} /><RecordBottomSheet categories={categories} onClose={() => setSelectedSession(undefined)} onDelete={deleteRecord} onSave={saveRecord} session={selectedSession} tags={tags} /></section>;
}

function formatSelectedDay(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(date: Date): string { return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function formatDuration(seconds: number): string { const minutes = Math.floor(seconds / 60); return `${minutes} min`; }
function formatMinutes(seconds: number): string { return `${Math.floor(seconds / 60)} min`; }
