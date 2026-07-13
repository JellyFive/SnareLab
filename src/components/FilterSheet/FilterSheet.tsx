import { useEffect, useState } from "react";

import type { Category, LogFilter, Tag } from "../../types";
import { displayCategory, displayTag } from "../../utils/classificationLabels";

export interface FilterSheetProps {
  categories: Category[];
  filter: LogFilter;
  onApply: (filter: LogFilter) => void;
  onClose: () => void;
  open: boolean;
  tags: Tag[];
}

export function FilterSheet({
  categories,
  filter,
  onApply,
  onClose,
  open,
  tags,
}: FilterSheetProps) {
  const [draft, setDraft] = useState<LogFilter>(filter);

  useEffect(() => setDraft(filter), [filter, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="sheet-backdrop" role="presentation">
      <section aria-label="筛选练习记录" aria-modal="true" className="bottom-sheet" role="dialog">
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__header">
          <h2>筛选</h2>
          <button aria-label="关闭筛选" className="icon-button" onClick={onClose} type="button">关闭</button>
        </div>
        <fieldset className="filter-sheet__group">
          <legend>分类</legend>
          <ChoiceList
            items={categories.map((category) => ({ id: category.id, label: displayCategory(category) }))}
            selectedIds={draft.categoryIds ?? []}
            onToggle={(id) => setDraft((current) => ({ ...current, categoryIds: toggleId(current.categoryIds, id) }))}
          />
        </fieldset>
        <fieldset className="filter-sheet__group">
          <legend>标签</legend>
          <ChoiceList
            items={tags.map((tag) => ({ id: tag.id, label: displayTag(tag) }))}
            selectedIds={draft.tagIds ?? []}
            onToggle={(id) => setDraft((current) => ({ ...current, tagIds: toggleId(current.tagIds, id) }))}
          />
        </fieldset>
        <div className="bottom-sheet__actions">
          <button className="button button--secondary" onClick={() => { setDraft({}); onApply({}); }} type="button">清除筛选</button>
          <button className="button" onClick={() => onApply(normalizeFilter(draft))} type="button">应用筛选</button>
        </div>
      </section>
    </div>
  );
}

function ChoiceList({ items, onToggle, selectedIds }: { items: Array<{ id: string; label: string }>; onToggle: (id: string) => void; selectedIds: string[] }) {
  return <div className="choice-list">{items.map((item) => <label className="choice-list__item" key={item.id}><input checked={selectedIds.includes(item.id)} onChange={() => onToggle(item.id)} type="checkbox" />{item.label}</label>)}</div>;
}

function toggleId(ids: string[] | undefined, id: string): string[] {
  const current = ids ?? [];
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

function normalizeFilter(filter: LogFilter): LogFilter {
  return {
    categoryIds: filter.categoryIds?.length ? filter.categoryIds : undefined,
    tagIds: filter.tagIds?.length ? filter.tagIds : undefined,
  };
}
