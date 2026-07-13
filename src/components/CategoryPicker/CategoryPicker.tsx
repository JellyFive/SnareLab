import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import type { Category } from "../../types";
import { displayCategory } from "../../utils/classificationLabels";

interface CategoryPickerProps {
  categories: Category[];
  onChange: (categoryId: string) => void;
  value: string;
}

export function CategoryPicker({ categories, onChange, value }: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategory = categories.find((category) => category.id === value);

  return <section className="save-sheet__category" aria-label="练习分类"><h3>练习分类</h3><button aria-expanded={isOpen} aria-haspopup="listbox" aria-label="选择练习分类" className="save-sheet__category-trigger" onClick={() => setIsOpen((current) => !current)} type="button"><span>{selectedCategory ? displayCategory(selectedCategory) : "请选择分类"}</span><ChevronDown aria-hidden="true" size={18} /></button>{isOpen && <div aria-label="分类选项" className="save-sheet__category-options" role="listbox">{categories.map((category) => <button aria-selected={category.id === value} className={`save-sheet__category-option${category.id === value ? " save-sheet__category-option--selected" : ""}`} key={category.id} onClick={() => { onChange(category.id); setIsOpen(false); }} role="option" type="button"><span className="save-sheet__category-swatch" style={{ background: category.color }} />{displayCategory(category)}{category.id === value && <Check aria-hidden="true" size={16} />}</button>)}</div>}</section>;
}
