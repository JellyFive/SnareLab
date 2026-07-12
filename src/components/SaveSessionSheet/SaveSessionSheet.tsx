import { Check, ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ImageAttachmentGrid } from "../ImageAttachmentGrid";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import type { Category, ImageAttachment, PendingSessionDraft, Tag } from "../../types";

export interface SaveSessionMetadata {
  attachments: ImageAttachment[];
  categoryId: string;
  note?: string;
  tagIds: string[];
}

interface SaveSessionSheetProps {
  categories: Category[];
  draft: PendingSessionDraft;
  isProcessingImages?: boolean;
  imageError?: string;
  isSaving?: boolean;
  saveError?: string;
  onAddImages: (files: File[]) => void;
  onCreateCategory: (name: string) => Promise<Category | undefined>;
  onCreateTag: (name: string) => Promise<Tag | undefined>;
  onDiscard: () => void;
  onRemoveImage: (attachmentId: string) => void;
  onSave: (metadata: SaveSessionMetadata) => void;
  onSaveForLater: (metadata: SaveSessionMetadata) => void;
  tags: Tag[];
}

export function SaveSessionSheet({
  categories,
  draft,
  imageError,
  isProcessingImages,
  isSaving = false,
  onAddImages,
  onCreateCategory,
  onCreateTag,
  onDiscard,
  onRemoveImage,
  onSave,
  onSaveForLater,
  saveError,
  tags,
}: SaveSessionSheetProps) {
  const dialogRef = useDialogFocus(true);
  const [categoryId, setCategoryId] = useState(draft.categoryId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(draft.tagIds ?? []);
  const [note, setNote] = useState(draft.note ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  useEffect(() => {
    setCategoryId(draft.categoryId ?? "");
    setTagIds(draft.tagIds ?? []);
    setNote(draft.note ?? "");
  }, [draft.id]);

  const metadata = (): SaveSessionMetadata => ({
    attachments: draft.attachments,
    categoryId,
    tagIds,
    note: note.trim() || undefined,
  });
  const toggleTag = (tagId: string) => setTagIds((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]);

  const addCategory = async () => {
    const created = await onCreateCategory(newCategory.trim());
    if (!created) return;
    setCategoryId(created.id);
    setNewCategory("");
    setIsAddingCategory(false);
  };
  const addTag = async () => {
    const created = await onCreateTag(newTag.trim());
    if (!created) return;
    setTagIds((current) => current.includes(created.id) ? current : [...current, created.id]);
    setNewTag("");
    setIsAddingTag(false);
  };

  const selectedCategory = categories.find((category) => category.id === categoryId);

  return createPortal(<div className="sheet-backdrop"><section aria-label="保存本次练习" aria-modal="true" className="bottom-sheet save-sheet" ref={dialogRef} role="dialog"><div className="bottom-sheet__handle" /><div className="bottom-sheet__header"><div><h2>保存本次练习</h2><p className="muted">练习时长将自动保存</p></div><button aria-label="放弃本次练习" className="icon-button" data-dialog-initial-focus onClick={onDiscard} type="button"><X aria-hidden="true" size={20} /></button></div><p className="save-sheet__duration">{formatDuration(draft.duration)}</p><section className="save-sheet__category" aria-label="练习分类"><h3>练习分类</h3><button aria-expanded={isCategoryPickerOpen} aria-haspopup="listbox" aria-label="选择练习分类" className="save-sheet__category-trigger" onClick={() => setIsCategoryPickerOpen((current) => !current)} type="button"><span>{selectedCategory ? displayCategory(selectedCategory) : "请选择分类"}</span><ChevronDown aria-hidden="true" size={18} /></button>{isCategoryPickerOpen && <div aria-label="分类选项" className="save-sheet__category-options" role="listbox">{categories.map((category) => <button aria-selected={category.id === categoryId} className={`save-sheet__category-option${category.id === categoryId ? " save-sheet__category-option--selected" : ""}`} key={category.id} onClick={() => { setCategoryId(category.id); setIsCategoryPickerOpen(false); }} role="option" type="button"><span className="save-sheet__category-swatch" style={{ background: category.color }} />{displayCategory(category)}{category.id === categoryId && <Check aria-hidden="true" size={16} />}</button>)}</div>}</section><InlineCreateForm actionLabel="添加分类" inputLabel="新分类名称" isOpen={isAddingCategory} onCancel={() => setIsAddingCategory(false)} onChange={setNewCategory} onConfirm={addCategory} onOpen={() => setIsAddingCategory(true)} value={newCategory} /><fieldset className="filter-sheet__group"><legend>标签</legend><div className="choice-list">{tags.map((tag) => <label className="choice-list__item" key={tag.id}><input aria-label={displayTag(tag)} checked={tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} type="checkbox" />{displayTag(tag)}</label>)}</div></fieldset><InlineCreateForm actionLabel="添加标签" inputLabel="新标签名称" isOpen={isAddingTag} onCancel={() => setIsAddingTag(false)} onChange={setNewTag} onConfirm={addTag} onOpen={() => setIsAddingTag(true)} value={newTag} /><label className="record-sheet__field">备注<textarea aria-label="备注" onChange={(event) => setNote(event.target.value)} placeholder="记录这次练习的感受" value={note} /></label><section className="save-sheet__images" aria-label="练习图片"><h3>图片</h3><ImageAttachmentGrid attachments={draft.attachments} errorMessage={imageError} isLoading={isProcessingImages} onAddFiles={onAddImages} onRemove={onRemoveImage} /></section>{saveError && <p className="form-error" role="alert">{saveError}</p>}<div className="bottom-sheet__actions"><button className="button button--secondary" disabled={isSaving} onClick={() => onSaveForLater(metadata())} type="button">稍后保存</button><button className="button" disabled={!categoryId || isSaving} onClick={() => onSave(metadata())} type="button">{isSaving ? "正在保存" : "保存记录"}</button></div></section></div>, document.body);
}

function InlineCreateForm({ actionLabel, inputLabel, isOpen, onCancel, onChange, onConfirm, onOpen, value }: { actionLabel: string; inputLabel: string; isOpen: boolean; onCancel: () => void; onChange: (value: string) => void; onConfirm: () => void; onOpen: () => void; value: string }) {
  if (!isOpen) return <button className="save-sheet__quick-add" onClick={onOpen} type="button"><Plus aria-hidden="true" size={15} />{actionLabel}</button>;
  return <div className="save-sheet__quick-form"><input aria-label={inputLabel} autoFocus onChange={(event) => onChange(event.target.value)} placeholder={inputLabel} value={value} /><button className="button" disabled={!value.trim()} onClick={onConfirm} type="button">确定</button><button aria-label={`取消${actionLabel}`} className="icon-button" onClick={onCancel} type="button"><X aria-hidden="true" size={18} /></button></div>;
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 3600).toString().padStart(2, "0")}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function displayCategory(category: Category): string {
  return ({ fundamentals: "基本功", coordination: "手脚协调", "song-practice": "曲目练习", "free-practice": "自由练习", uncategorized: "未分类" }[category.id] ?? category.name);
}

function displayTag(tag: Tag): string {
  return ({ "single-stroke": "单跳", "double-stroke": "双跳", paradiddle: "复合跳", rudiment: "基本功", groove: "律动", fill: "过门", timing: "节奏", dynamics: "力度", speed: "速度", control: "控制", independence: "独立性", reading: "视奏", endurance: "耐力", accuracy: "准确性" }[tag.id] ?? tag.name);
}
