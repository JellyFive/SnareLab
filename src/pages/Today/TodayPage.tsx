import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { db } from "../../database/dexie";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import { clearPendingSessionDraft, getPendingSessionDraft } from "../../services/pendingSessionDraftService";
import type { Category, PendingSessionDraft, PracticeSession, Tag } from "../../types";

export function TodayPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [draft, setDraft] = useState<PendingSessionDraft | undefined>(() => getPendingSessionDraft());

  useEffect(() => {
    void Promise.all([
      new SessionRepository(db).findToday(),
      new CategoryRepository(db).findAll(),
      new TagRepository(db).findAll(),
    ]).then(([nextSessions, nextCategories, nextTags]) => {
      setSessions(nextSessions);
      setCategories(nextCategories);
      setTags(nextTags);
    });
  }, []);

  const total = sessions.reduce((sum, session) => sum + session.duration, 0);
  const discardDraft = () => {
    if (draft && draft.duration > 0 && !window.confirm("Discard this unsaved practice session? This cannot be undone.")) return;
    clearPendingSessionDraft();
    setDraft(undefined);
  };

  return <section className="today-page" aria-labelledby="today-title"><header className="page-header"><div><p className="page-header__product">SnareLab</p><h1 id="today-title">Today</h1></div><p className="muted">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></header>{draft && <aside className="draft-banner"><div><strong>You have an unsaved practice session.</strong><p>{formatDuration(draft.duration)} is ready to save.</p></div><div className="draft-banner__actions"><button className="button" onClick={() => navigate("/timer", { state: { recoverDraft: true } })} type="button">Continue Saving</button><button className="button button--secondary" onClick={discardDraft} type="button">Discard</button></div></aside>}<section className="today-summary" aria-label="Today's summary"><div><span>Today's total</span><strong>{formatDuration(total)}</strong></div><div><span>Sessions</span><strong>{sessions.length}</strong></div></section><button aria-label="Start practice timer" className="button today-page__start" onClick={() => navigate("/timer")} type="button">Start Timer</button><section className="today-records"><h2>Today&apos;s records</h2>{sessions.length === 0 ? <p className="today-page__empty">No practice recorded today.</p> : <ul className="today-record-list">{sessions.map((session) => <li key={session.id}><div><strong>{categories.find((category) => category.id === session.categoryId)?.name ?? "Uncategorized"}</strong><span>{formatTime(session.startTime)} · {formatDuration(session.duration)}</span></div><div>{tags.filter((tag) => session.tagIds.includes(tag.id)).map((tag) => <span className="tag-chip" key={tag.id}>{tag.name}</span>)}</div>{session.note && <p>{session.note}</p>}</li>)}</ul>}</section></section>;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
