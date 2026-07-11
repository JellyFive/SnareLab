import { useEffect, useState } from "react";

import type { Category, LogFilter, Tag } from "../../types";

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
      <section aria-label="Filter practice log" aria-modal="true" className="bottom-sheet" role="dialog">
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__header">
          <h2>Filter log</h2>
          <button className="icon-button" onClick={onClose} type="button">Close</button>
        </div>
        <fieldset className="filter-sheet__group">
          <legend>Category</legend>
          <ChoiceList
            items={categories.map((category) => ({ id: category.id, label: category.name }))}
            selectedIds={draft.categoryIds ?? []}
            onToggle={(id) => setDraft((current) => ({ ...current, categoryIds: toggleId(current.categoryIds, id) }))}
          />
        </fieldset>
        <fieldset className="filter-sheet__group">
          <legend>Tags</legend>
          <ChoiceList
            items={tags.map((tag) => ({ id: tag.id, label: tag.name }))}
            selectedIds={draft.tagIds ?? []}
            onToggle={(id) => setDraft((current) => ({ ...current, tagIds: toggleId(current.tagIds, id) }))}
          />
        </fieldset>
        <div className="filter-sheet__dates">
          <label>Start date<input aria-label="Start date" type="date" value={dateInputValue(draft.startDate)} onChange={(event) => setDraft((current) => ({ ...current, startDate: parseDate(event.target.value) }))} /></label>
          <label>End date<input aria-label="End date" type="date" value={dateInputValue(draft.endDate)} onChange={(event) => setDraft((current) => ({ ...current, endDate: parseDate(event.target.value) }))} /></label>
        </div>
        <div className="filter-sheet__dates">
          <label>Minimum duration (minutes)<input aria-label="Minimum duration in minutes" inputMode="numeric" min="0" type="number" value={draft.minDuration === undefined ? "" : draft.minDuration / 60} onChange={(event) => setDraft((current) => ({ ...current, minDuration: minutesToSeconds(event.target.value) }))} /></label>
          <label>Maximum duration (minutes)<input aria-label="Maximum duration in minutes" inputMode="numeric" min="0" type="number" value={draft.maxDuration === undefined ? "" : draft.maxDuration / 60} onChange={(event) => setDraft((current) => ({ ...current, maxDuration: minutesToSeconds(event.target.value) }))} /></label>
        </div>
        <div className="bottom-sheet__actions">
          <button className="button button--secondary" onClick={() => { setDraft({}); onApply({}); }} type="button">Reset filters</button>
          <button className="button" onClick={() => onApply(normalizeFilter(draft))} type="button">Apply filters</button>
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

function dateInputValue(date: Date | undefined): string {
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "";
}

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function minutesToSeconds(value: string): number | undefined {
  return value === "" ? undefined : Math.max(0, Number(value) * 60);
}

function normalizeFilter(filter: LogFilter): LogFilter {
  return {
    ...filter,
    categoryIds: filter.categoryIds?.length ? filter.categoryIds : undefined,
    tagIds: filter.tagIds?.length ? filter.tagIds : undefined,
  };
}
