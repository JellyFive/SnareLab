import type { Category, Tag } from "../types";

const categoryLabels: Record<string, { initialName: string; label: string }> = {
  fundamentals: { initialName: "Fundamentals", label: "基本功" },
  coordination: { initialName: "Coordination", label: "手脚协调" },
  "song-practice": { initialName: "Song Practice", label: "曲目练习" },
  "free-practice": { initialName: "Free Practice", label: "自由练习" },
  uncategorized: { initialName: "Uncategorized", label: "未分类" },
};

const tagLabels: Record<string, { initialName: string; label: string }> = {
  "single-stroke": { initialName: "Single Stroke", label: "单跳" },
  "double-stroke": { initialName: "Double Stroke", label: "双跳" },
  paradiddle: { initialName: "Paradiddle", label: "复合跳" },
  rudiment: { initialName: "Rudiment", label: "基本功" },
  groove: { initialName: "Groove", label: "律动" },
  fill: { initialName: "Fill", label: "过门" },
  timing: { initialName: "Timing", label: "节奏" },
  dynamics: { initialName: "Dynamics", label: "力度" },
  speed: { initialName: "Speed", label: "速度" },
  control: { initialName: "Control", label: "控制" },
  independence: { initialName: "Independence", label: "独立性" },
  reading: { initialName: "Reading", label: "视奏" },
  endurance: { initialName: "Endurance", label: "耐力" },
  accuracy: { initialName: "Accuracy", label: "准确性" },
};

export function displayCategory(category: Category | undefined): string {
  if (!category) return "未分类";
  const translated = categoryLabels[category.id];
  return translated && category.name === translated.initialName ? translated.label : category.name;
}

export function displayTag(tag: Tag): string {
  const translated = tagLabels[tag.id];
  return translated && tag.name === translated.initialName ? translated.label : tag.name;
}
