import { ChevronLeft, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SaveSessionSheet, type SaveSessionMetadata } from "../../components/SaveSessionSheet";
import snareLabMark from "../../assets/snarelab-mark.svg";
import { db, type SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import { compressImageAttachment, ImageAttachmentError, removeAttachment, validateAttachmentCapacity } from "../../services/imageAttachmentService";
import { clearPendingSessionDraft, getPendingSessionDraft, savePendingSessionDraft } from "../../services/pendingSessionDraftService";
import { useTimerStore } from "../../store/timerStore";
import type { Category, PendingSessionDraft, Tag } from "../../types";

type RecoveryState = { recoverDraft?: boolean };
export interface TimerPageProps { database?: SnareLabDatabase; }

export function TimerPage({ database = db }: TimerPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const timer = useTimerStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [recoveredDraft, setRecoveredDraft] = useState<PendingSessionDraft>();
  const [imageError, setImageError] = useState<string>();
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const refreshClassifications = async () => {
    const [nextCategories, nextTags] = await Promise.all([new CategoryRepository(database).findAll(), new TagRepository(database).findAll()]);
    setCategories(nextCategories);
    setTags(nextTags);
  };
  useEffect(() => { void Promise.all([ensureDefaultCategories(database), ensurePresetTags(database)]).then(refreshClassifications); }, [database]);
  useEffect(() => { if ((location.state as RecoveryState | null)?.recoverDraft) void getPendingSessionDraft(database).then(setRecoveredDraft); }, [database, location.state]);
  useEffect(() => { if (timer.status !== "running") return; const interval = window.setInterval(() => useTimerStore.getState().tick(), 1000); return () => window.clearInterval(interval); }, [timer.status]);

  const finishedDraft = useMemo(
    () => toPendingDraft(timer),
    [timer.elapsedSeconds, timer.endTime, timer.startTime, timer.status],
  );
  const activeDraft = recoveredDraft ?? finishedDraft;
  const exitToToday = () => navigate("/");
  const requestReset = () => { if (timer.elapsedSeconds > 0 && !window.confirm("确定要重置本次练习吗？")) return; timer.reset(); };
  const withMetadata = (metadata: SaveSessionMetadata): PendingSessionDraft | undefined => activeDraft && { ...activeDraft, ...metadata };
  const saveForLater = async (metadata: SaveSessionMetadata) => { const draft = withMetadata(metadata); if (!draft) return; await savePendingSessionDraft(database, draft); timer.reset(); exitToToday(); };
  const discard = async () => { if (activeDraft && !window.confirm("放弃后将无法恢复本次未保存的练习，确定继续吗？")) return; await clearPendingSessionDraft(database); setRecoveredDraft(undefined); timer.reset(); exitToToday(); };
  const save = async (metadata: SaveSessionMetadata) => {
    const draft = withMetadata(metadata);
    if (!draft || !draft.categoryId) return;
    setIsSaving(true);
    setSaveError(undefined);
    try {
      const { id: _draftId, createdAt: _draftCreatedAt, ...sessionInput } = draft;
      await new SessionRepository(database).saveSession({ ...sessionInput, categoryId: draft.categoryId });
      await clearPendingSessionDraft(database);
      setRecoveredDraft(undefined);
      timer.reset();
      exitToToday();
    } catch {
      setSaveError("保存失败，请检查后重试。");
    } finally {
      setIsSaving(false);
    }
  };
  const addImages = async (files: File[]) => {
    if (!activeDraft) return;
    setImageError(undefined);
    try {
      validateAttachmentCapacity(activeDraft.attachments, files.length);
      setIsProcessingImages(true);
      const attachments = await Promise.all(files.map((file, index) => compressImageAttachment(file, { sortOrder: activeDraft.attachments.length + index })));
      setRecoveredDraft({ ...activeDraft, attachments: [...activeDraft.attachments, ...attachments] });
    } catch (error) { setImageError(error instanceof ImageAttachmentError ? error.message : "图片处理失败，请重试。"); } finally { setIsProcessingImages(false); }
  };
  const removeImage = (attachmentId: string) => { if (activeDraft) setRecoveredDraft({ ...activeDraft, attachments: removeAttachment(activeDraft.attachments, attachmentId) }); };
  const createCategory = async (name: string) => { if (!name) return undefined; const category = await new CategoryRepository(database).createCategory({ name, icon: "drum", color: "#5B63F6" }); await refreshClassifications(); return category; };
  const createTag = async (name: string) => { if (!name) return undefined; const tag = await new TagRepository(database).createTag({ name, color: "#5B63F6" }); await refreshClassifications(); return tag; };

  return <section className="timer-page" aria-labelledby="timer-title"><header className="timer-page__header"><button aria-label="返回今日" className="icon-button" onClick={exitToToday} type="button"><ChevronLeft aria-hidden="true" size={24} /></button><span className="timer-page__brand"><img alt="SnareLab 标识" src={snareLabMark} /><span>SnareLab</span></span><span aria-hidden="true" className="timer-page__header-spacer" /></header><h1 className="sr-only" id="timer-title">练习计时</h1><div className={`timer-page__dial timer-page__dial--${timer.status}`}><p aria-live="polite">{activeDraft ? formatDuration(activeDraft.duration) : formatDuration(timer.elapsedSeconds)}</p><span>{activeDraft ? "练习完成" : timer.status === "paused" ? "已暂停" : timer.status === "running" ? "练习中" : "准备开始"}</span></div>{!activeDraft && <TimerControls status={timer.status} onFinish={() => timer.finish()} onPause={() => timer.pause()} onReset={requestReset} onResume={() => timer.resume()} onStart={() => timer.start()} />}{activeDraft && <SaveSessionSheet categories={categories} draft={activeDraft} imageError={imageError} isProcessingImages={isProcessingImages} isSaving={isSaving} onAddImages={addImages} onCreateCategory={createCategory} onCreateTag={createTag} onDiscard={() => void discard()} onRemoveImage={removeImage} onSave={(metadata) => void save(metadata)} onSaveForLater={(metadata) => void saveForLater(metadata)} saveError={saveError} tags={tags} />}</section>;
}

function TimerControls({ status, onFinish, onPause, onReset, onResume, onStart }: { status: ReturnType<typeof useTimerStore.getState>["status"]; onFinish: () => void; onPause: () => void; onReset: () => void; onResume: () => void; onStart: () => void }) {
  if (status === "idle") return <button aria-label="开始练习计时" className="timer-control timer-control--primary" onClick={onStart} type="button"><Play aria-hidden="true" fill="currentColor" size={25} /><span>开始</span></button>;
  return <div className="timer-page__controls"><button aria-label="重置本次练习" className="timer-control" onClick={onReset} type="button"><RotateCcw aria-hidden="true" size={20} /><span>重置</span></button><button aria-label={status === "running" ? "暂停练习计时" : "继续练习计时"} className="timer-control timer-control--primary" onClick={status === "running" ? onPause : onResume} type="button">{status === "running" ? <Pause aria-hidden="true" fill="currentColor" size={25} /> : <Play aria-hidden="true" fill="currentColor" size={25} />}<span>{status === "running" ? "暂停" : "继续"}</span></button><button aria-label="结束本次练习" className="timer-control" onClick={onFinish} type="button"><Square aria-hidden="true" fill="currentColor" size={18} /><span>结束</span></button></div>;
}

function toPendingDraft(timer: ReturnType<typeof useTimerStore.getState>): PendingSessionDraft | undefined { if (timer.status !== "finished" || !timer.startTime || !timer.endTime) return undefined; return { id: crypto.randomUUID(), startTime: timer.startTime, endTime: timer.endTime, duration: timer.elapsedSeconds, attachments: [], createdAt: new Date() }; }
function formatDuration(seconds: number): string { return `${Math.floor(seconds / 3600).toString().padStart(2, "0")}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`; }
