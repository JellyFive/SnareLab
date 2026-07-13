import { useEffect, useState } from "react";

import { ImageAttachmentGrid } from "../ImageAttachmentGrid";
import { CategoryPicker } from "../CategoryPicker";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { compressImageAttachment, ImageAttachmentError, moveAttachment, removeAttachment, validateAttachmentCapacity } from "../../services/imageAttachmentService";
import type { Category, ImageAttachment, PracticeSession, Tag } from "../../types";
import { displayCategory, displayTag } from "../../utils/classificationLabels";

export interface RecordBottomSheetProps {
  categories: Category[];
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string, input: { attachments: ImageAttachment[]; categoryId: string; note?: string; tagIds: string[] }) => Promise<void>;
  session: PracticeSession | undefined;
  tags: Tag[];
}

export function RecordBottomSheet({ categories, onClose, onDelete, onSave, session, tags }: RecordBottomSheetProps) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageError, setImageError] = useState<string>();
  const [error, setError] = useState<string>();
  const dialogRef = useDialogFocus(Boolean(session));

  useEffect(() => {
    if (!session) return;
    setMode("view");
    setCategoryId(session.categoryId);
    setTagIds(session.tagIds);
    setAttachments(session.attachments);
    setNote(session.note ?? "");
    setError(undefined);
    setImageError(undefined);
  }, [session]);

  if (!session) return null;

  const categoryName = displayCategory(categories.find((category) => category.id === session.categoryId));
  const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id));
  const readOnly = <div className="record-sheet__facts"><label>练习时长<input aria-label="练习时长" readOnly value={formatDuration(session.duration)} /></label><label>练习时间<input aria-label="练习时间" readOnly value={formatTimeRange(session.startTime, session.endTime)} /></label></div>;

  const addImages = async (files: File[]) => {
    setIsProcessingImages(true);
    setImageError(undefined);
    try {
      validateAttachmentCapacity(attachments, files.length);
      const nextAttachments = await Promise.all(files.map((file, index) => compressImageAttachment(file, { sortOrder: attachments.length + index })));
      setAttachments((current) => [...current, ...nextAttachments]);
    } catch (reason) {
      setImageError(reason instanceof ImageAttachmentError ? reason.message : "图片处理失败，请重试。");
    } finally {
      setIsProcessingImages(false);
    }
  };

  return <div className="sheet-backdrop" role="presentation"><section aria-label="练习记录详情" aria-modal="true" className="bottom-sheet record-sheet" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }} ref={dialogRef} role="dialog"><div className="bottom-sheet__handle" />
    {mode === "view" && <><div className="bottom-sheet__header"><h2>练习记录</h2><button aria-label="关闭记录详情" className="icon-button" data-dialog-initial-focus onClick={onClose} type="button">关闭</button></div>{readOnly}<section className="record-sheet__metadata"><h3>分类</h3><p>{categoryName}</p><h3>标签</h3><div className="chip-row">{sessionTags.length ? sessionTags.map((tag) => <span className="tag-chip" key={tag.id}>{displayTag(tag)}</span>) : <span className="muted">未添加标签</span>}</div><h3>备注</h3><p>{session.note || "未添加备注"}</p><h3>图片</h3><ImageAttachmentGrid attachments={attachments} editable={false} onAddFiles={() => undefined} onRemove={() => undefined} /></section><div className="bottom-sheet__actions"><button className="button button--secondary" onClick={() => setMode("edit")} type="button">编辑记录</button><button className="button button--danger" onClick={() => setMode("confirm-delete")} type="button">删除记录</button></div></>}
    {mode === "edit" && <><div className="bottom-sheet__header"><h2>编辑记录</h2><button aria-label="取消编辑" className="icon-button" onClick={() => setMode("view")} type="button">取消</button></div>{readOnly}<CategoryPicker categories={categories} onChange={setCategoryId} value={categoryId} /><fieldset className="filter-sheet__group"><legend>标签</legend><ChoiceList selectedIds={tagIds} tags={tags} onToggle={(id) => setTagIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} /></fieldset><label className="record-sheet__field">备注<textarea aria-label="备注" onChange={(event) => setNote(event.target.value)} value={note} /></label><section className="record-sheet__images" aria-label="练习图片"><h3>图片</h3><ImageAttachmentGrid attachments={attachments} errorMessage={imageError} isLoading={isProcessingImages} onAddFiles={(files) => void addImages(files)} onMove={(id, target) => setAttachments((current) => moveAttachment(current, id, target))} onRemove={(id) => setAttachments((current) => removeAttachment(current, id))} /></section>{error && <p className="form-error" role="alert">{error}</p>}<div className="bottom-sheet__actions"><button className="button button--secondary" disabled={isSaving || isProcessingImages} onClick={() => setMode("view")} type="button">取消</button><button className="button" disabled={isSaving || isProcessingImages || !categoryId} onClick={async () => { setIsSaving(true); setError(undefined); try { await onSave(session.id, { attachments, categoryId, tagIds, note: note || undefined }); setMode("view"); } catch { setError("记录保存失败，请重试。"); } finally { setIsSaving(false); } }} type="button">{isSaving ? "正在保存" : "保存修改"}</button></div></>}
    {mode === "confirm-delete" && <><div className="bottom-sheet__header"><h2>删除记录</h2><button aria-label="取消删除" className="icon-button" onClick={() => setMode("view")} type="button">取消</button></div><p>删除后无法恢复这条练习记录。</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="bottom-sheet__actions"><button className="button button--secondary" onClick={() => setMode("view")} type="button">取消</button><button className="button button--danger" disabled={isSaving} onClick={async () => { setIsSaving(true); setError(undefined); try { await onDelete(session.id); onClose(); } catch { setError("删除记录失败，请重试。"); } finally { setIsSaving(false); } }} type="button">{isSaving ? "正在删除" : "确认删除"}</button></div></>}
  </section></div>;
}

function ChoiceList({ onToggle, selectedIds, tags }: { onToggle: (id: string) => void; selectedIds: string[]; tags: Tag[] }) {
  return <div className="choice-list">{tags.map((tag) => <label className="choice-list__item" key={tag.id}><input aria-label={displayTag(tag)} checked={selectedIds.includes(tag.id)} onChange={() => onToggle(tag.id)} type="checkbox" />{displayTag(tag)}</label>)}</div>;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} 小时 ${minutes % 60} 分钟` : `${minutes} 分钟`;
}

function formatDateTime(value: Date): string {
  return value.toLocaleString("zh-CN", { dateStyle: "long", timeStyle: "short", hourCycle: "h23" });
}

function formatTimeRange(startTime: Date, endTime: Date): string {
  const sameDate = startTime.getFullYear() === endTime.getFullYear() && startTime.getMonth() === endTime.getMonth() && startTime.getDate() === endTime.getDate();
  const end = sameDate ? endTime.toLocaleTimeString("zh-CN", { hour: "2-digit", hourCycle: "h23", minute: "2-digit" }) : formatDateTime(endTime);
  return `${formatDateTime(startTime)} - ${end}`;
}
