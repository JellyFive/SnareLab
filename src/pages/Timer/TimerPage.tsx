import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SaveSessionSheet } from "../../components/SaveSessionSheet";
import { db, type SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import { clearPendingSessionDraft, getPendingSessionDraft, savePendingSessionDraft } from "../../services/pendingSessionDraftService";
import { useTimerStore } from "../../store/timerStore";
import type { Category, PendingSessionDraft, Tag } from "../../types";

type RecoveryState = { recoverDraft?: boolean };

export interface TimerPageProps {
  database?: SnareLabDatabase;
}

export function TimerPage({ database = db }: TimerPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const timer = useTimerStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [recoveredDraft, setRecoveredDraft] = useState<PendingSessionDraft>();

  useEffect(() => {
    void Promise.all([ensureDefaultCategories(database), ensurePresetTags(database)]).then(async () => {
      const [nextCategories, nextTags] = await Promise.all([new CategoryRepository(database).findAll(), new TagRepository(database).findAll()]);
      setCategories(nextCategories);
      setTags(nextTags);
    });
  }, [database]);

  useEffect(() => {
    if ((location.state as RecoveryState | null)?.recoverDraft) setRecoveredDraft(getPendingSessionDraft());
  }, [location.state]);

  useEffect(() => {
    if (timer.status !== "running") return;
    const interval = window.setInterval(() => useTimerStore.getState().tick(), 1000);
    return () => window.clearInterval(interval);
  }, [timer.status]);

  const activeDraft = recoveredDraft ?? toPendingDraft(timer);
  const elapsed = formatDuration(timer.elapsedSeconds);
  const exitToToday = () => navigate("/");
  const saveForLater = () => {
    if (!activeDraft) return;
    savePendingSessionDraft(activeDraft);
    timer.reset();
    exitToToday();
  };
  const discard = () => {
    if (activeDraft && !window.confirm("Discard this unsaved practice session? This cannot be undone.")) return;
    clearPendingSessionDraft();
    setRecoveredDraft(undefined);
    timer.reset();
    exitToToday();
  };
  const save = async (metadata: { categoryId: string; tagIds: string[]; note?: string }) => {
    if (!activeDraft) return;
    await new SessionRepository(database).saveSession({ ...activeDraft, ...metadata });
    clearPendingSessionDraft();
    setRecoveredDraft(undefined);
    timer.reset();
    exitToToday();
  };

  return <section className="timer-page" aria-labelledby="timer-title"><header className="page-header"><div><p className="page-header__product">SnareLab</p><h1 id="timer-title">Timer</h1></div><button aria-label="Back to Today" className="icon-button" onClick={exitToToday} type="button">Back</button></header><p aria-live="polite" className="timer-page__value">{activeDraft ? formatDuration(activeDraft.duration) : elapsed}</p><p className="muted">{timer.status === "idle" ? "Ready to practice" : timer.status}</p>{!activeDraft && timer.status === "idle" && <button aria-label="Start practice timer" className="button" onClick={() => timer.start()} type="button">Start</button>}{!activeDraft && timer.status === "running" && <div className="timer-page__controls"><button aria-label="Pause practice timer" className="button button--secondary" onClick={() => timer.pause()} type="button">Pause</button><button aria-label="End practice and save" className="button" onClick={() => timer.finish()} type="button">End</button></div>}{!activeDraft && timer.status === "paused" && <div className="timer-page__controls"><button aria-label="Resume practice timer" className="button" onClick={() => timer.resume()} type="button">Resume</button><button aria-label="End practice and save" className="button button--secondary" onClick={() => timer.finish()} type="button">End</button><button className="button button--secondary" onClick={() => timer.reset()} type="button">Reset</button></div>}{activeDraft && <SaveSessionSheet categories={categories} draft={activeDraft} onDiscard={discard} onSave={save} onSaveForLater={saveForLater} tags={tags} />}</section>;
}

function toPendingDraft(timer: ReturnType<typeof useTimerStore.getState>): PendingSessionDraft | undefined {
  if (timer.status !== "finished" || !timer.startTime || !timer.endTime) return undefined;
  return { id: crypto.randomUUID(), startTime: timer.startTime, endTime: timer.endTime, duration: timer.elapsedSeconds, createdAt: new Date() };
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
