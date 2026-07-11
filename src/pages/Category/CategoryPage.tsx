import { useEffect, useMemo, useState } from "react";

import { db, type SnareLabDatabase } from "../../database/dexie";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import type { Category, PracticeSession, Tag } from "../../types";

type ActiveTab = "categories" | "tags";
type FormState =
  | { kind: "category"; item?: Category }
  | { kind: "tag"; item?: Tag };
type DeletionState =
  | { kind: "category"; item: Category }
  | { kind: "tag"; item: Tag };

export interface CategoryPageProps {
  database?: SnareLabDatabase;
}

export function CategoryPage({ database = db }: CategoryPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [form, setForm] = useState<FormState>();
  const [deletion, setDeletion] = useState<DeletionState>();
  const [error, setError] = useState<string>();

  const categoryRepository = useMemo(() => new CategoryRepository(database), [database]);
  const tagRepository = useMemo(() => new TagRepository(database), [database]);
  const sessionRepository = useMemo(() => new SessionRepository(database), [database]);

  const reload = async () => {
    try {
      const [nextCategories, nextTags, nextSessions] = await Promise.all([
        categoryRepository.findAll(),
        tagRepository.findAll(),
        sessionRepository.filterSessions({}),
      ]);
      setCategories(nextCategories);
      setTags(nextTags);
      setSessions(nextSessions);
      setError(undefined);
    } catch {
      setError("Classification data could not be loaded. Try again.");
    }
  };

  useEffect(() => { void reload(); }, [database]);

  const categorySummary = (categoryId: string) => summarize(sessions.filter((session) => session.categoryId === categoryId));
  const tagSessionCount = (tagId: string) => sessions.filter((session) => session.tagIds.includes(tagId)).length;

  const saveForm = async (input: { color?: string; icon?: string; name: string }) => {
    if (!form) return;
    if (form.kind === "category") {
      const categoryInput = { color: input.color || "#5B63F6", icon: input.icon || "folder", name: input.name };
      if (form.item) await categoryRepository.updateCategory(form.item.id, categoryInput);
      else await categoryRepository.createCategory(categoryInput);
    } else {
      const tagInput = { color: input.color || undefined, name: input.name };
      if (form.item) await tagRepository.updateTag(form.item.id, tagInput);
      else await tagRepository.createTag(tagInput);
    }
    setForm(undefined);
    await reload();
  };

  const confirmDeletion = async () => {
    if (!deletion) return;
    if (deletion.kind === "category") await categoryRepository.deleteCategory(deletion.item.id);
    else await tagRepository.deleteTag(deletion.item.id);
    setDeletion(undefined);
    await reload();
  };

  return <section aria-labelledby="category-page-title" className="category-page">
    <header className="page-header"><div><p className="page-header__product">SnareLab</p><h1 id="category-page-title">Category & Tags</h1></div><button className="button" onClick={() => setForm(activeTab === "categories" ? { kind: "category" } : { kind: "tag" })} type="button">{activeTab === "categories" ? "Add category" : "Add tag"}</button></header>
    <div aria-label="Classification type" className="segmented-control" role="tablist"><button aria-selected={activeTab === "categories"} className={activeTab === "categories" ? "segmented-control__tab segmented-control__tab--active" : "segmented-control__tab"} onClick={() => setActiveTab("categories")} role="tab" type="button">Categories</button><button aria-selected={activeTab === "tags"} className={activeTab === "tags" ? "segmented-control__tab segmented-control__tab--active" : "segmented-control__tab"} onClick={() => setActiveTab("tags")} role="tab" type="button">Tags</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {activeTab === "categories" ? <section aria-label="Categories" className="classification-list">{categories.map((category) => { const summary = categorySummary(category.id); return <article className="classification-row" key={category.id}><span aria-hidden="true" className="classification-row__swatch" style={{ backgroundColor: category.color }} /><div className="classification-row__body"><h2>{category.name}</h2><p>{summary.sessionCount} {summary.sessionCount === 1 ? "session" : "sessions"} · {summary.minutes} min</p></div><div className="classification-row__actions"><button aria-label={`Edit ${category.name}`} className="icon-button" onClick={() => setForm({ kind: "category", item: category })} type="button">Edit</button>{!category.isSystem && <button aria-label={`Delete ${category.name}`} className="icon-button classification-row__delete" onClick={() => setDeletion({ kind: "category", item: category })} type="button">Delete</button>}</div></article>; })}</section> : <section aria-label="Tags" className="classification-list">{tags.map((tag) => <article className="classification-row" key={tag.id}><span aria-hidden="true" className="classification-row__swatch classification-row__swatch--tag" style={{ backgroundColor: tag.color ?? "#EEF0FF" }} /><div className="classification-row__body"><h2>{tag.name}</h2><p>{tagSessionCount(tag.id)} linked {tagSessionCount(tag.id) === 1 ? "session" : "sessions"}{tag.isPreset ? " · Preset" : ""}</p></div><div className="classification-row__actions"><button aria-label={`Edit ${tag.name}`} className="icon-button" onClick={() => setForm({ kind: "tag", item: tag })} type="button">Edit</button><button aria-label={`Delete ${tag.name}`} className="icon-button classification-row__delete" onClick={() => setDeletion({ kind: "tag", item: tag })} type="button">Delete</button></div></article>)}</section>}
    {form && <ClassificationForm form={form} onClose={() => setForm(undefined)} onSave={saveForm} />}
    {deletion && <DeleteConfirmation deletion={deletion} onCancel={() => setDeletion(undefined)} onConfirm={() => void confirmDeletion()} />}
  </section>;
}

function ClassificationForm({ form, onClose, onSave }: { form: FormState; onClose: () => void; onSave: (input: { color?: string; icon?: string; name: string }) => Promise<void> }) {
  const [name, setName] = useState(form.item?.name ?? "");
  const [color, setColor] = useState(form.item?.color ?? (form.kind === "category" ? "#5B63F6" : ""));
  const [icon, setIcon] = useState(form.kind === "category" ? form.item?.icon ?? "folder" : "");
  const [saving, setSaving] = useState(false);
  const label = form.kind === "category" ? "Category" : "Tag";

  return <div className="sheet-backdrop" role="presentation"><section aria-label={`${form.item ? "Edit" : "Add"} ${label}`} aria-modal="true" className="bottom-sheet classification-form" role="dialog"><div className="bottom-sheet__handle" /><div className="bottom-sheet__header"><h2>{form.item ? `Edit ${label}` : `Add ${label}`}</h2><button className="icon-button" onClick={onClose} type="button">Close</button></div><label className="record-sheet__field">{label} name<input aria-label={`${label} name`} autoFocus onChange={(event) => setName(event.target.value)} value={name} /></label>{form.kind === "category" && <label className="record-sheet__field">Icon<input aria-label="Category icon" onChange={(event) => setIcon(event.target.value)} value={icon} /></label>}<label className="record-sheet__field">Color<input aria-label={`${label} color`} onChange={(event) => setColor(event.target.value)} value={color} /></label><div className="bottom-sheet__actions"><button className="button button--secondary" onClick={onClose} type="button">Cancel</button><button className="button" disabled={!name.trim() || saving} onClick={async () => { setSaving(true); try { await onSave({ color, icon, name: name.trim() }); } finally { setSaving(false); } }} type="button">Save {form.kind}</button></div></section></div>;
}

function DeleteConfirmation({ deletion, onCancel, onConfirm }: { deletion: DeletionState; onCancel: () => void; onConfirm: () => void }) {
  const isCategory = deletion.kind === "category";
  return <div className="sheet-backdrop" role="presentation"><section aria-label={`Delete ${isCategory ? "category" : "tag"}`} aria-modal="true" className="bottom-sheet" role="dialog"><div className="bottom-sheet__handle" /><div className="bottom-sheet__header"><h2>Delete {deletion.item.name}?</h2><button className="icon-button" onClick={onCancel} type="button">Close</button></div><p>{isCategory ? "Linked practice records will move to Uncategorized. This cannot be undone." : "This tag will be removed from related practice records. The records will remain."}</p><div className="bottom-sheet__actions"><button className="button button--secondary" onClick={onCancel} type="button">Cancel deletion</button><button className="button button--danger" onClick={onConfirm} type="button">Delete {isCategory ? "category" : "tag"}</button></div></section></div>;
}

function summarize(sessions: PracticeSession[]): { minutes: number; sessionCount: number } {
  return { minutes: Math.floor(sessions.reduce((total, session) => total + session.duration, 0) / 60), sessionCount: sessions.length };
}
