import { useEffect, useState } from "react";

import { useDialogFocus } from "../../hooks/useDialogFocus";
import type { Category, PracticeSession, Tag } from "../../types";

export interface RecordBottomSheetProps {
  categories: Category[];
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string, input: { categoryId: string; note?: string; tagIds: string[] }) => Promise<void>;
  session: PracticeSession | undefined;
  tags: Tag[];
}

export function RecordBottomSheet({ categories, onClose, onDelete, onSave, session, tags }: RecordBottomSheetProps) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const dialogRef = useDialogFocus(Boolean(session));

  useEffect(() => {
    if (!session) return;
    setMode("view");
    setCategoryId(session.categoryId);
    setTagIds(session.tagIds);
    setNote(session.note ?? "");
    setError(undefined);
  }, [session]);

  if (!session) return null;

  const categoryName = categories.find((category) => category.id === session.categoryId)?.name ?? "Uncategorized";
  const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id));
  const readOnly = <div className="record-sheet__facts"><label>Duration<input aria-label="Duration" readOnly value={formatDuration(session.duration)} /></label><label>Start time<input aria-label="Start time" readOnly value={formatDateTime(session.startTime)} /></label><label>End time<input aria-label="End time" readOnly value={formatDateTime(session.endTime)} /></label></div>;

  return <div className="sheet-backdrop" role="presentation"><section aria-label="Practice record" aria-modal="true" className="bottom-sheet record-sheet" ref={dialogRef} role="dialog"><div className="bottom-sheet__handle" />
    {mode === "view" && <><div className="bottom-sheet__header"><h2>Practice record</h2><button className="icon-button" data-dialog-initial-focus onClick={onClose} type="button">Close</button></div>{readOnly}<section className="record-sheet__metadata"><h3>Category</h3><p>{categoryName}</p><h3>Tags</h3><div className="chip-row">{sessionTags.length ? sessionTags.map((tag) => <span className="tag-chip" key={tag.id}>{tag.name}</span>) : <span className="muted">No tags</span>}</div><h3>Note</h3><p>{session.note || "No note"}</p></section><div className="bottom-sheet__actions"><button className="button button--secondary" onClick={() => setMode("edit")} type="button">Edit record</button><button aria-label="Delete practice record" className="button button--danger" onClick={() => setMode("confirm-delete")} type="button">Delete</button></div></>}
    {mode === "edit" && <><div className="bottom-sheet__header"><h2>Edit record</h2><button className="icon-button" onClick={() => setMode("view")} type="button">Cancel</button></div>{readOnly}<label className="record-sheet__field">Category<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><fieldset className="filter-sheet__group"><legend>Tags</legend><ChoiceList selectedIds={tagIds} tags={tags} onToggle={(id) => setTagIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} /></fieldset><label className="record-sheet__field">Note<textarea aria-label="Note" onChange={(event) => setNote(event.target.value)} value={note} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="bottom-sheet__actions"><button className="button button--secondary" onClick={() => setMode("view")} type="button">Cancel</button><button className="button" disabled={isSaving || !categoryId} onClick={async () => { setIsSaving(true); setError(undefined); try { await onSave(session.id, { categoryId, tagIds, note: note || undefined }); setMode("view"); } catch { setError("The record could not be updated. Try again."); } finally { setIsSaving(false); } }} type="button">Save changes</button></div></>}
    {mode === "confirm-delete" && <><div className="bottom-sheet__header"><h2>Delete record?</h2><button className="icon-button" onClick={() => setMode("view")} type="button">Close</button></div><p>This will permanently delete this practice record. It cannot be undone.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="bottom-sheet__actions"><button className="button button--secondary" onClick={() => setMode("view")} type="button">Cancel deletion</button><button className="button button--danger" disabled={isSaving} onClick={async () => { setIsSaving(true); setError(undefined); try { await onDelete(session.id); } catch { setError("The record could not be deleted. Try again."); } finally { setIsSaving(false); } }} type="button">Delete permanently</button></div></>}
  </section></div>;
}

function ChoiceList({ onToggle, selectedIds, tags }: { onToggle: (id: string) => void; selectedIds: string[]; tags: Tag[] }) {
  return <div className="choice-list">{tags.map((tag) => <label className="choice-list__item" key={tag.id}><input checked={selectedIds.includes(tag.id)} onChange={() => onToggle(tag.id)} type="checkbox" />{tag.name}</label>)}</div>;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function formatDateTime(value: Date): string {
  return value.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
