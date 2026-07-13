import { BarChart3, ChevronDown, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { db, type SnareLabDatabase } from "../../database/dexie";
import { ensureDefaultCategories, ensurePresetTags } from "../../database/seedDefaults";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { CategoryRepository } from "../../repositories/categoryRepository";
import { SessionRepository } from "../../repositories/sessionRepository";
import { TagRepository } from "../../repositories/tagRepository";
import type { Category, PracticeSession, Tag } from "../../types";
import { displayCategory, displayTag } from "../../utils/classificationLabels";

type ManagementKind = "category" | "tag";
type ManagedItem = Category | Tag;
type SortMode = "name" | "usage";

interface ClassificationManagementSheetProps {
  database?: SnareLabDatabase;
  kind: ManagementKind;
  onChanged: () => void;
  onClose: () => void;
}

export function ClassificationManagementSheet({ database = db, kind, onChanged, onClose }: ClassificationManagementSheetProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [formItem, setFormItem] = useState<ManagedItem>();
  const [isCreating, setIsCreating] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ManagedItem>();
  const [statisticsItem, setStatisticsItem] = useState<ManagedItem>();
  const [activeMenu, setActiveMenu] = useState<ManagedItem>();
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("usage");
  const [error, setError] = useState<string>();
  const dialogRef = useDialogFocus(true);
  const categoryRepository = useMemo(() => new CategoryRepository(database), [database]);
  const tagRepository = useMemo(() => new TagRepository(database), [database]);
  const sessionRepository = useMemo(() => new SessionRepository(database), [database]);
  const isCategory = kind === "category";
  const noun = isCategory ? "分类" : "标签";
  const title = `${noun}管理`;

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
      setError("管理数据加载失败，请重试。");
    }
  };

  useEffect(() => {
    void Promise.all([ensureDefaultCategories(database), ensurePresetTags(database)]).then(reload);
  }, [database, kind]);

  const items = isCategory ? categories : tags;
  const itemName = (item: ManagedItem) => isCategory ? displayCategory(item as Category) : displayTag(item as Tag);
  const itemSessions = (item: ManagedItem) => isCategory
    ? sessions.filter((session) => session.categoryId === item.id)
    : sessions.filter((session) => session.tagIds.includes(item.id));
  const count = (item: ManagedItem) => itemSessions(item).length;
  const visibleItems = useMemo(() => items
    .filter((item) => itemName(item).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((left, right) => sortMode === "usage"
      ? count(right) - count(left) || itemName(left).localeCompare(itemName(right), "zh-CN")
      : itemName(left).localeCompare(itemName(right), "zh-CN")), [items, query, sortMode, sessions]);

  const save = async (input: { color?: string; icon?: string; name: string }) => {
    try {
      if (isCategory) {
        const categoryInput = { color: input.color || "#535BF2", icon: input.icon || "folder", name: input.name };
        if (formItem) await categoryRepository.updateCategory(formItem.id, categoryInput);
        else await categoryRepository.createCategory(categoryInput);
      } else {
        const tagInput = { color: input.color || undefined, name: input.name };
        if (formItem) await tagRepository.updateTag(formItem.id, tagInput);
        else await tagRepository.createTag(tagInput);
      }
      setFormItem(undefined);
      setIsCreating(false);
      await reload();
      onChanged();
    } catch {
      setError("保存失败，请重试。");
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      if (isCategory) await categoryRepository.deleteCategory(deleteItem.id);
      else await tagRepository.deleteTag(deleteItem.id);
      setDeleteItem(undefined);
      setActiveMenu(undefined);
      await reload();
      onChanged();
    } catch {
      setError("删除失败，请重试。");
    }
  };

  if (formItem || isCreating) return <ClassificationForm item={formItem} kind={kind} onCancel={() => { setFormItem(undefined); setIsCreating(false); }} onSave={save} />;
  if (deleteItem) return <DeleteConfirmation item={deleteItem} kind={kind} onCancel={() => setDeleteItem(undefined)} onConfirm={() => void confirmDelete()} />;
  if (statisticsItem) return <ClassificationStatistics item={statisticsItem} kind={kind} sessions={itemSessions(statisticsItem)} onClose={() => setStatisticsItem(undefined)} />;

  return <div className="classification-manager-backdrop" role="presentation"><section aria-label={title} aria-modal="true" className="classification-manager" ref={dialogRef} role="dialog"><header className="classification-manager__header"><h2>{title}</h2><div><button aria-label={`新建${noun}`} className="classification-manager__create" onClick={() => setIsCreating(true)} type="button"><Plus aria-hidden="true" size={19} /><span>新建{noun}</span></button><button aria-label={`关闭${title}`} className="icon-button classification-manager__close" data-dialog-initial-focus onClick={onClose} type="button"><X aria-hidden="true" size={20} /></button></div></header><label className="classification-manager__search"><Search aria-hidden="true" size={21} /><input aria-label={`搜索${noun}`} placeholder={`搜索${noun}`} role="searchbox" onChange={(event) => setQuery(event.target.value)} value={query} /></label><div className="classification-manager__toolbar"><p>我的{noun}<span>{items.length} 个{noun}</span></p><button aria-label="切换排序方式" className="classification-manager__sort" onClick={() => setSortMode((current) => current === "usage" ? "name" : "usage")} type="button">{sortMode === "usage" ? "使用频率" : "名称排序"}<ChevronDown aria-hidden="true" size={17} /></button></div>{error && <p className="form-error" role="alert">{error}</p>}<section aria-label={`${noun}列表`} className="classification-manager__list">{visibleItems.map((item) => { const name = itemName(item); const systemCategory = isCategory && (item as Category).isSystem; const itemCount = count(item); return <article className="classification-manager__row" key={item.id}><span aria-hidden="true" className="classification-manager__color" style={{ backgroundColor: itemColor(item, isCategory) }} /><strong>{name}</strong><span className="classification-manager__count">{systemCategory ? "系统分类" : `${itemCount} 条练习记录`}</span><div className="classification-manager__more"><button aria-expanded={activeMenu?.id === item.id} aria-label={`更多${name}操作`} className="icon-button" onClick={() => setActiveMenu((current) => current?.id === item.id ? undefined : item)} type="button"><MoreHorizontal aria-hidden="true" size={22} /></button>{activeMenu?.id === item.id && <div aria-label={`${name}操作`} className="classification-manager__menu" role="menu"><button onClick={() => { setFormItem(item); setActiveMenu(undefined); }} role="menuitem" type="button"><Pencil aria-hidden="true" size={17} />编辑{noun}</button><button onClick={() => { setStatisticsItem(item); setActiveMenu(undefined); }} role="menuitem" type="button"><BarChart3 aria-hidden="true" size={17} />查看统计</button>{!systemCategory && <button className="classification-manager__menu-delete" onClick={() => { setDeleteItem(item); setActiveMenu(undefined); }} role="menuitem" type="button"><Trash2 aria-hidden="true" size={17} />删除{noun}</button>}</div>}</div></article>; })}</section>{visibleItems.length === 0 && <p className="classification-manager__empty">没有找到匹配的{noun}</p>}</section></div>;
}

function ClassificationForm({ item, kind, onCancel, onSave }: { item?: ManagedItem; kind: ManagementKind; onCancel: () => void; onSave: (input: { color?: string; icon?: string; name: string }) => Promise<void> }) {
  const [name, setName] = useState(item?.name ?? "");
  const [color, setColor] = useState(itemColor(item, kind === "category"));
  const [icon, setIcon] = useState(kind === "category" ? (item as Category | undefined)?.icon ?? "folder" : "");
  const [isSaving, setIsSaving] = useState(false);
  const isCategory = kind === "category";
  const noun = isCategory ? "分类" : "标签";
  const title = `${item ? "编辑" : "新建"}${noun}`;
  const dialogRef = useDialogFocus(true);

  return <div className="sheet-backdrop" role="presentation"><section aria-label={title} aria-modal="true" className="bottom-sheet classification-form" ref={dialogRef} role="dialog"><div className="bottom-sheet__handle" /><div className="bottom-sheet__header classification-form__header"><div><h2>{title}</h2><p>为{noun}设置名称和颜色</p></div><button aria-label={`关闭${title}`} className="icon-button" onClick={onCancel} type="button"><X aria-hidden="true" size={20} /></button></div><section className="classification-form__section"><h3>基本信息</h3><label className="classification-form__field"><span>{noun}名称</span><input aria-label={`${noun}名称`} autoFocus onChange={(event) => setName(event.target.value)} placeholder={`输入${noun}名称`} value={name} /></label>{isCategory && <label className="classification-form__field"><span>图标</span><input aria-label="分类图标" onChange={(event) => setIcon(event.target.value)} placeholder="例如：drum" value={icon} /></label>}</section><section className="classification-form__section"><h3>{noun}颜色</h3><div className="classification-form__palette">{COLOR_OPTIONS.map((option) => <button aria-label={`选择${option.name}`} aria-pressed={color.toLowerCase() === option.value.toLowerCase()} className={`classification-form__swatch${color.toLowerCase() === option.value.toLowerCase() ? " classification-form__swatch--selected" : ""}`} key={option.value} onClick={() => setColor(option.value)} style={{ backgroundColor: option.value }} type="button" />)}<label aria-label={`自定义${noun}颜色`} className="classification-form__custom-color"><input aria-label={`${noun}颜色`} onChange={(event) => setColor(event.target.value)} type="color" value={color} /><span>自定义</span></label></div><p className="classification-form__color-value">当前颜色 {color.toUpperCase()}</p></section><div className="bottom-sheet__actions"><button className="button button--secondary" disabled={isSaving} onClick={onCancel} type="button">取消</button><button className="button" disabled={!name.trim() || isSaving} onClick={async () => { setIsSaving(true); await onSave({ color, icon, name: name.trim() }); setIsSaving(false); }} type="button">{isSaving ? "正在保存" : `保存${noun}`}</button></div></section></div>;
}

function ClassificationStatistics({ item, kind, onClose, sessions }: { item: ManagedItem; kind: ManagementKind; onClose: () => void; sessions: PracticeSession[] }) {
  const isCategory = kind === "category";
  const name = isCategory ? displayCategory(item as Category) : displayTag(item as Tag);
  const totalDuration = sessions.reduce((total, session) => total + session.duration, 0);
  const latest = [...sessions].sort((left, right) => right.startTime.getTime() - left.startTime.getTime())[0];
  const dialogRef = useDialogFocus(true);

  return <div className="sheet-backdrop" role="presentation"><section aria-label={`${name}统计`} aria-modal="true" className="bottom-sheet classification-statistics" ref={dialogRef} role="dialog"><div className="bottom-sheet__handle" /><div className="bottom-sheet__header"><h2>{name}统计</h2><button aria-label="关闭统计" className="icon-button" data-dialog-initial-focus onClick={onClose} type="button"><X aria-hidden="true" size={20} /></button></div><div className="classification-statistics__grid"><article><span>使用次数</span><strong>{sessions.length} 条练习记录</strong></article><article><span>累计时长</span><strong>{formatDuration(totalDuration)}</strong></article><article><span>最近练习</span><strong>{latest ? formatDate(latest.startTime) : "暂无记录"}</strong></article></div></section></div>;
}

function DeleteConfirmation({ item, kind, onCancel, onConfirm }: { item: ManagedItem; kind: ManagementKind; onCancel: () => void; onConfirm: () => void }) {
  const isCategory = kind === "category";
  const noun = isCategory ? "分类" : "标签";
  const name = isCategory ? displayCategory(item as Category) : displayTag(item as Tag);
  const title = `删除${noun}`;
  const description = isCategory ? `删除“${name}”后，关联练习记录会自动归入“未分类”，且无法恢复。` : `删除“${name}”后，它会从关联练习记录中移除，练习记录本身会保留。`;

  return <div className="sheet-backdrop" role="presentation"><section aria-label={title} aria-modal="true" className="bottom-sheet" role="dialog"><div className="bottom-sheet__handle" /><div className="bottom-sheet__header"><h2>{title}</h2><button aria-label="取消删除" className="icon-button" onClick={onCancel} type="button"><X aria-hidden="true" size={20} /></button></div><p>{description}</p><div className="bottom-sheet__actions"><button className="button button--secondary" onClick={onCancel} type="button">取消</button><button className="button button--danger" onClick={onConfirm} type="button">确认删除</button></div></section></div>;
}

function itemColor(item: ManagedItem | undefined, isCategory: boolean): string {
  if (isCategory && item) return (item as Category).color;
  if (item && (item as Tag).color) return (item as Tag).color ?? "#535BF2";
  const colors = ["#2672F3", "#8D4BE8", "#54C743", "#FF8A14", "#32BFC2", "#EF4B82"];
  const key = item?.id ?? "new-item";
  return colors[[...key].reduce((total, char) => total + char.charCodeAt(0), 0) % colors.length];
}

const COLOR_OPTIONS = [
  { name: "靛蓝色", value: "#535BF2" },
  { name: "蓝色", value: "#2672F3" },
  { name: "紫色", value: "#8D4BE8" },
  { name: "绿色", value: "#54C743" },
  { name: "珊瑚色", value: "#F26F45" },
  { name: "金色", value: "#D69A00" },
];

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} 小时 ${minutes % 60} 分钟` : `${minutes} 分钟`;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}
