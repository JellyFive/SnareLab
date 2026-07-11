import { useState } from "react";

import { useDialogFocus } from "../../hooks/useDialogFocus";
import type { Category, PendingSessionDraft, Tag } from "../../types";

interface SaveSessionSheetProps {
  categories: Category[];
  draft: PendingSessionDraft;
  onDiscard: () => void;
  onSave: (metadata: { categoryId: string; tagIds: string[]; note?: string }) => void;
  onSaveForLater: () => void;
  tags: Tag[];
}

export function SaveSessionSheet({ categories, draft, onDiscard, onSave, onSaveForLater, tags }: SaveSessionSheetProps) {
  const dialogRef = useDialogFocus(true);
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const duration = formatDuration(draft.duration);

  const toggleTag = (tagId: string) => setTagIds((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]);

  return <div className="sheet-backdrop"><section aria-label="Save Session" aria-modal="true" className="bottom-sheet save-sheet" ref={dialogRef} role="dialog"><div className="bottom-sheet__handle" /><div className="bottom-sheet__header"><h2>Save Session</h2><button aria-label="Discard session" className="icon-button" data-dialog-initial-focus onClick={onDiscard} type="button">Close</button></div><p className="save-sheet__duration">{duration}</p><p className="muted">Duration is read-only.</p><label className="record-sheet__field">Category<select aria-label="Category" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><fieldset className="filter-sheet__group"><legend>Tags</legend><div className="choice-list">{tags.map((tag) => <label className="choice-list__item" key={tag.id}><input aria-label={tag.name} checked={tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} type="checkbox" />{tag.name}</label>)}</div></fieldset><label className="record-sheet__field">Note<textarea aria-label="Note" onChange={(event) => setNote(event.target.value)} value={note} /></label><div className="bottom-sheet__actions"><button className="button button--secondary" onClick={onSaveForLater} type="button">Save for later</button><button className="button" disabled={!categoryId} onClick={() => onSave({ categoryId, tagIds, note: note.trim() || undefined })} type="button">Save Record</button></div></section></div>;
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
