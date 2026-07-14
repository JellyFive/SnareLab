# SnareLab Grid Editor v0.4.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 SnareLab Practice Log v0.3 上新增第四个“编辑”Tab，交付可持久化、可撤销、响应式并能通过本地鼓采样真实播放的 Canvas Grid Editor。

**Architecture:** React/DOM 负责文档栏、轨道控制和 Transport，Canvas 负责 Grid、音符与播放头；节奏位置统一使用 480 PPQ Tick。Dexie 负责节奏文档和编辑器偏好，Zustand 负责当前编辑会话与 Undo/Redo，独立 `RhythmAudioEngine` 使用 Web Audio 音频时钟和 look-ahead scheduler 播放本地采样。

**Tech Stack:** React 19、TypeScript strict、Vite、React Router、Zustand、Dexie/IndexedDB、Canvas 2D、Web Audio API、vite-plugin-pwa、Vitest、Testing Library、Playwright。

## Global Constraints

- 以 `docs/V0.4/SnareLab_Grid_Editor_v0.4.0_Design_Spec.md` 为 V0.4.0 唯一需求基准。
- 写任何代码前完整阅读 `docs/V0.2/`、识别 V0.3 原型，并复读本计划当前任务。
- 不重建项目，不更换现有 React、Vite、Dexie、Zustand、Vitest、Playwright 或 PWA 技术栈。
- 主导航固定为“今日 / 记录 / 统计 / 编辑”，编辑器路由固定为 `/editor`。
- V0.4.0 固定 4/4、480 PPQ、每拍四个 16 分音符 Step、1–16 小节。
- 固定 8 条轨道：Hi-Hat、Snare、Kick、Tom 1、Tom 2、Tom 3、Ride、Crash。
- 首版音符 UI 只有“无音符／普通音符”；力度、三连音、32 分音符、连音和开闭镲只在模型中预留。
- 内置一套具有明确使用权的本地鼓采样；离线状态必须可编辑、保存和播放。
- 编辑器数据不得创建或修改 `PracticeSession`，不得进入 Today、记录或统计聚合。
- Figure Library、五线谱、Count-in、节拍器、多音色、轨道增删和拖动连续绘制不进入 V0.4.0。
- 页面和 React 组件不得直接访问 Dexie 表；音频精准调度不得依赖 React 渲染或普通 UI 定时器。
- 每个任务至少执行相关测试、`npm run typecheck`、`npm run build` 和 `git diff --check`。
- 涉及页面交互或响应式时运行 Playwright；涉及 PWA 时检查生产构建的 Workbox 产物。
- 每个重大任务完成后暂停，先提供手动验收范围；车老板确认通过后更新 `memory-bank/process.md` 与 `memory-bank/arch.md`，再开始下一任务。
- 每个任务完成后回复：`车老板！已完成！`

---

## Target File Structure

```text
public/audio/drum-kit/
├── LICENSE.md
├── hi-hat.wav
├── snare.wav
├── kick.wav
├── tom-1.wav
├── tom-2.wav
├── tom-3.wav
├── ride.wav
└── crash.wav

src/features/editor/
├── audio/
│   ├── RhythmAudioEngine.ts
│   ├── RhythmAudioEngine.test.ts
│   └── sampleManifest.ts
├── components/
│   ├── EditorToolbar.tsx
│   ├── EditorToolbar.test.tsx
│   ├── MeasureControls.tsx
│   ├── RhythmGridCanvas.tsx
│   ├── RhythmGridCanvas.test.tsx
│   ├── TrackControlPanel.tsx
│   ├── TransportControls.tsx
│   └── TransportControls.test.tsx
├── domain/
│   ├── rhythmCommands.ts
│   ├── rhythmCommands.test.ts
│   ├── rhythmConstants.ts
│   ├── rhythmGridGeometry.ts
│   ├── rhythmGridGeometry.test.ts
│   ├── rhythmTiming.ts
│   └── rhythmTiming.test.ts
└── hooks/
    ├── useEditorAudio.ts
    ├── useEditorAudio.test.tsx
    ├── useRhythmDocumentAutosave.ts
    └── useRhythmDocumentAutosave.test.tsx

src/pages/Editor/
├── EditorPage.tsx
└── EditorPage.test.tsx

src/repositories/
├── rhythmDocumentRepository.ts
└── rhythmDocumentRepository.test.ts

src/store/
├── editorStore.ts
└── editorStore.test.ts

src/types/
├── index.ts
└── rhythm.ts
```

职责规则：领域命令保持纯函数；Repository 是 Dexie 唯一访问边界；Store 只管理编辑会话；Hook 协调 React 生命周期；Audio Engine 不导入 React；Canvas 组件不保存数据。

---

### Task 1: Rhythm Types and Dexie v5 Schema

**Deliverable:** 现有数据库无损升级，并能存储节奏文档与编辑器偏好；尚不提供 UI。

**Files:**
- Create: `src/types/rhythm.ts`
- Modify: `src/types/index.ts`
- Modify: `src/database/dexie.ts`
- Modify: `src/database/database.test.ts`
- Test: `src/database/database.test.ts`

**Interfaces:**
- Produces: `RhythmTrackId`, `RhythmTrack`, `RhythmNote`, `RhythmDocument`, `EditorPreferences`。
- Produces: `SnareLabDatabase.rhythmDocuments` and `SnareLabDatabase.editorPreferences` Dexie tables。

- [x] **Step 1: Write failing type and database tests**

Add a compile-time fixture and change the table assertion to require the two new stores:

```typescript
const rhythmDocument: RhythmDocument = {
  id: "rhythm-1",
  name: "未命名节奏",
  bpm: 120,
  ppq: 480,
  timeSignature: { numerator: 4, denominator: 4 },
  subdivision: "sixteenth",
  measureCount: 1,
  tracks: RHYTHM_TRACK_IDS.map((id) => ({ id, mute: false, solo: false })),
  notes: [],
  createdAt: now,
  updatedAt: now,
};

expect(database.tables.map((table) => table.name).sort()).toEqual([
  "categories",
  "editorPreferences",
  "pendingDrafts",
  "rhythmDocuments",
  "sessions",
  "tags",
]);
```

- [x] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/database/database.test.ts`  
Expected: FAIL because rhythm types and Dexie tables do not exist.

- [x] **Step 3: Define the exact rhythm types**

Create `src/types/rhythm.ts` with the approved contracts:

```typescript
export const RHYTHM_TRACK_IDS = [
  "hi-hat", "snare", "kick", "tom-1", "tom-2", "tom-3", "ride", "crash",
] as const;

export type RhythmTrackId = (typeof RHYTHM_TRACK_IDS)[number];

export interface RhythmTrack {
  id: RhythmTrackId;
  mute: boolean;
  solo: boolean;
}

export interface RhythmNote {
  id: string;
  trackId: RhythmTrackId;
  tick: number;
  durationTicks: number;
  velocity: number;
  articulation: "normal" | "closed" | "open";
  tie?: "start" | "continue" | "stop";
  tuplet?: { actualNotes: number; normalNotes: number };
}

export interface RhythmDocument {
  id: string;
  name: string;
  bpm: number;
  ppq: 480;
  timeSignature: { numerator: 4; denominator: 4 };
  subdivision: "sixteenth";
  measureCount: number;
  tracks: RhythmTrack[];
  notes: RhythmNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorPreferences {
  key: "editor";
  lastDocumentId?: string;
  updatedAt: Date;
}
```

Re-export these contracts from `src/types/index.ts`.

- [x] **Step 4: Add Dexie version 5 without an upgrade mutation**

Extend `SnareLabDatabase`:

```typescript
rhythmDocuments!: Table<RhythmDocument, string>;
editorPreferences!: Table<EditorPreferences, string>;

this.version(5).stores({
  sessions: "id, createdAt, updatedAt, categoryId, startTime, endTime, duration, *tagIds",
  categories: "id, name, isSystem, updatedAt",
  tags: "id, name, isPreset, updatedAt",
  pendingDrafts: "id, createdAt",
  rhythmDocuments: "id, name, updatedAt",
  editorPreferences: "key, updatedAt",
});
```

Do not add a v4-to-v5 data rewrite; adding empty tables is sufficient.

- [x] **Step 5: Prove v4 data survives the v5 upgrade**

Create a legacy v4 database with one session, one category, one tag and one pending draft; open it using `SnareLabDatabase`, then assert all four old values are unchanged and both new tables are empty.

- [x] **Step 6: Run verification**

Run: `npm test -- src/database/database.test.ts && npm run typecheck && npm run build && git diff --check`  
Expected: all commands exit 0; production build completes; old-data assertions pass.

- [x] **Step 7: Manual gate, architecture notes, and commit**

Manual check: open an existing V0.3 local database and verify Today, records and statistics still load. After approval, record schema v5 in both memory-bank files.

```bash
git add src/types src/database memory-bank
git commit -m "Add v0.4 rhythm document schema"
```

---

### Task 2: Rhythm Timing and Immutable Edit Commands

**Deliverable:** 所有音乐位置换算和文档编辑规则成为可独立测试的纯函数。

**Files:**
- Create: `src/features/editor/domain/rhythmConstants.ts`
- Create: `src/features/editor/domain/rhythmTiming.ts`
- Create: `src/features/editor/domain/rhythmTiming.test.ts`
- Create: `src/features/editor/domain/rhythmCommands.ts`
- Create: `src/features/editor/domain/rhythmCommands.test.ts`

**Interfaces:**
- Produces: `PPQ`, `TICKS_PER_STEP`, `TICKS_PER_MEASURE`, `MIN_MEASURES`, `MAX_MEASURES`.
- Produces: `tickToSeconds(tick, bpm)`, `stepToTick(measureIndex, stepIndex)`, `documentEndTick(document)`.
- Produces: `createDefaultRhythmDocument`, `toggleNote`, `appendMeasure`, `removeMeasure`, `clearMeasure`, `clearAllNotes`, `setTrackMute`, `setTrackSolo`, `setDocumentBpm`, `getAudibleTrackIds`.

- [x] **Step 1: Write failing timing tests**

```typescript
expect(stepToTick(0, 0)).toBe(0);
expect(stepToTick(1, 0)).toBe(1920);
expect(stepToTick(1, 15)).toBe(3720);
expect(tickToSeconds(480, 120)).toBe(0.5);
expect(documentEndTick({ measureCount: 16 })).toBe(30720);
```

Run: `npm test -- src/features/editor/domain/rhythmTiming.test.ts`  
Expected: FAIL because the module is missing.

- [x] **Step 2: Implement timing constants and conversions**

```typescript
export const PPQ = 480 as const;
export const TICKS_PER_STEP = 120;
export const TICKS_PER_MEASURE = 1920;
export const STEPS_PER_MEASURE = 16;
export const MIN_MEASURES = 1;
export const MAX_MEASURES = 16;

export function stepToTick(measureIndex: number, stepIndex: number): number {
  return measureIndex * TICKS_PER_MEASURE + stepIndex * TICKS_PER_STEP;
}

export function tickToSeconds(tick: number, bpm: number): number {
  return (tick / PPQ) * (60 / bpm);
}
```

Validate finite integer positions and BPM 40–240; invalid inputs must throw `RangeError`.

- [x] **Step 3: Write failing command tests**

Cover these exact behaviors: default document has 8 tracks and 1 measure; toggling the same cell twice returns to zero notes; duplicate notes cannot exist; appending stops at 16; deleting stops at 1; deleting measure 1 removes its notes and shifts later notes left by 1920 ticks; clear-current and clear-all are immutable; Solo selection and Mute precedence match the design.

- [x] **Step 4: Implement immutable commands**

Use commands with stable signatures:

```typescript
type RhythmEdit = (document: RhythmDocument) => RhythmDocument;

export function toggleNote(trackId: RhythmTrackId, tick: number): RhythmEdit;
export function appendMeasure(document: RhythmDocument): RhythmDocument;
export function removeMeasure(document: RhythmDocument, measureIndex: number): RhythmDocument;
export function clearMeasure(document: RhythmDocument, measureIndex: number): RhythmDocument;
export function clearAllNotes(document: RhythmDocument): RhythmDocument;
```

New notes use `durationTicks: 120`, `velocity: 0.8`, and `articulation: "normal"`. Every successful command updates `updatedAt`; rejected boundary commands return the original object.

- [x] **Step 5: Implement audible-track selection**

```typescript
export function getAudibleTrackIds(tracks: RhythmTrack[]): Set<RhythmTrackId> {
  const hasSolo = tracks.some((track) => track.solo);
  const audible = tracks.filter((track) =>
    hasSolo ? track.solo && !track.mute : !track.mute,
  );
  return new Set(audible.map((track) => track.id));
}
```

Mute has priority inside Solo mode. If every Solo track is also muted, the
audible set is empty; playback must not fall back to non-Solo tracks.

- [x] **Step 6: Run verification**

Run: `npm test -- src/features/editor/domain && npm run typecheck && npm run build && git diff --check`  
Expected: all timing and command tests pass and commands do not mutate their input fixtures.

- [x] **Step 7: Manual gate, memory-bank update, and commit**

Manual review: inspect test fixtures for first/last measure and Mute/Solo semantics. After approval, document PPQ and immutable command boundaries.

```bash
git add src/features/editor/domain memory-bank
git commit -m "Add rhythm timing and edit commands"
```

---

### Task 3: Rhythm Repository, Editor Store, and Autosave

**Deliverable:** 多文档 CRUD、恢复上次文档、100 步 Undo/Redo 和可靠自动保存可独立工作。

**Files:**
- Create: `src/repositories/rhythmDocumentRepository.ts`
- Create: `src/repositories/rhythmDocumentRepository.test.ts`
- Create: `src/store/editorStore.ts`
- Create: `src/store/editorStore.test.ts`
- Create: `src/features/editor/hooks/useRhythmDocumentAutosave.ts`
- Create: `src/features/editor/hooks/useRhythmDocumentAutosave.test.tsx`

**Interfaces:**
- Produces: class `RhythmDocumentRepository` with `list`, `findById`, `create`, `save`, `rename`, `delete`, `resolveInitialDocument`, `rememberLastDocument`.
- Produces: `useEditorStore` with `openDocument`, `applyEdit`, `undo`, `redo`, `replaceDocumentWithoutHistory`, `clearHistory`, `setSaveStatus`.
- Produces: `useRhythmDocumentAutosave({ document, repository, delayMs: 300 })` returning `flush` and `retry`.

- [x] **Step 1: Write repository tests against fake IndexedDB**

Require deterministic order by `updatedAt` descending, trimmed non-empty names, BPM and measure validation, last-document restoration, fallback to most recent document, and automatic default creation after deleting the final document.

Run: `npm test -- src/repositories/rhythmDocumentRepository.test.ts`  
Expected: FAIL because the repository is missing.

- [x] **Step 2: Implement the repository boundary**

```typescript
export class RhythmDocumentRepository {
  constructor(private readonly database: SnareLabDatabase = db) {}
  list(): Promise<RhythmDocument[]>;
  findById(id: string): Promise<RhythmDocument | undefined>;
  create(name?: string): Promise<RhythmDocument>;
  save(document: RhythmDocument): Promise<RhythmDocument>;
  rename(id: string, name: string): Promise<RhythmDocument>;
  delete(id: string): Promise<RhythmDocument>;
  resolveInitialDocument(): Promise<RhythmDocument>;
  rememberLastDocument(id: string): Promise<void>;
}
```

`save` must validate the whole aggregate before `put`; `delete` and fallback creation/opening must run in one transaction across both new tables.

- [x] **Step 3: Write failing editor-store tests**

Test: open clears history; `applyEdit` pushes the previous snapshot; undo and redo preserve immutable objects; the 101st edit drops the oldest snapshot; a new edit after undo clears redo; `replaceDocumentWithoutHistory` updates BPM/Mute/Solo without adding a Grid undo entry.

- [x] **Step 4: Implement the Zustand editor store**

```typescript
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorState {
  document?: RhythmDocument;
  undoStack: RhythmDocument[];
  redoStack: RhythmDocument[];
  saveStatus: SaveStatus;
  saveError?: string;
  openDocument(document: RhythmDocument): void;
  applyEdit(edit: (document: RhythmDocument) => RhythmDocument): void;
  replaceDocumentWithoutHistory(document: RhythmDocument): void;
  undo(): void;
  redo(): void;
  clearHistory(): void;
  setSaveStatus(status: SaveStatus, error?: string): void;
}
```

- [x] **Step 5: Write failing autosave-hook tests with fake timers**

Assert no save before 299ms, one save at 300ms, rapid edits coalesce, `flush()` saves immediately, failures set `error` without discarding the document, and `retry()` persists the same in-memory document.

- [x] **Step 6: Implement autosave with stale-write protection**

Use a monotonically increasing revision inside the hook. Only the newest completed request may set `saved`; an older completion must not overwrite a later `saving` or `error` state. `flush` cancels the timer and awaits the current document save.

- [x] **Step 7: Run verification**

Run: `npm test -- src/repositories/rhythmDocumentRepository.test.ts src/store/editorStore.test.ts src/features/editor/hooks/useRhythmDocumentAutosave.test.tsx && npm run typecheck && npm run build && git diff --check`  
Expected: all repository, history and timer-controlled autosave tests pass.

- [x] **Step 8: Manual gate, memory-bank update, and commit**

Manual check: use a temporary test harness to create, rename, reload and delete documents; simulate one rejected save and verify retry. After approval, record repository/store/autosave ownership.

```bash
git add src/repositories/rhythmDocumentRepository* src/store/editorStore* src/features/editor/hooks/useRhythmDocumentAutosave* memory-bank
git commit -m "Add rhythm documents and editor history"
```

---

### Task 4: Canvas Geometry and Accessible Grid Editing

**Deliverable:** Canvas 能清晰绘制最多 16 小节并通过鼠标、触摸和键盘编辑音符；尚不播放声音。

**Files:**
- Create: `src/features/editor/domain/rhythmGridGeometry.ts`
- Create: `src/features/editor/domain/rhythmGridGeometry.test.ts`
- Create: `src/features/editor/components/RhythmGridCanvas.tsx`
- Create: `src/features/editor/components/RhythmGridCanvas.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `createGridGeometry`, `hitTestGrid`, `cellToRect`, `moveGridCursor`.
- Produces: `<RhythmGridCanvas document cursorTick cursorTrackId playheadTick onToggleNote onCursorChange />`.

- [x] **Step 1: Write failing geometry tests**

Use fixed layout constants (`stepWidth: 32`, `rowHeight: 44`, `headerHeight: 36`) and assert exact hit results at boundaries, outside-canvas rejection, 1/16 beat and measure widths, and 16-measure total width.

```typescript
expect(hitTestGrid(geometry, { x: 33, y: 37 })).toEqual({ trackIndex: 0, stepIndex: 1 });
expect(hitTestGrid(geometry, { x: -1, y: 20 })).toBeUndefined();
```

- [x] **Step 2: Implement pure geometry helpers**

Geometry functions must not read the DOM or device pixel ratio. Return CSS-pixel rectangles; keep DPR scaling inside the component renderer.

- [x] **Step 3: Write failing Canvas component tests**

Mock `HTMLCanvasElement.getContext`. Assert canvas backing size is CSS size multiplied by DPR, one pointer activation calls `onToggleNote` with the expected `trackId/tick`, drag movement does not add notes, arrow keys move the cursor, and Space/Enter toggles the active cell.

- [x] **Step 4: Implement the Canvas renderer**

Keep draw order explicit:

```typescript
drawBackground(context, geometry);
drawStepLines(context, geometry);
drawBeatLines(context, geometry);
drawMeasureLines(context, geometry);
drawCursor(context, geometry, cursor);
drawNotes(context, geometry, document.notes);
drawPlayhead(context, geometry, playheadTick);
```

Use `ResizeObserver` to update CSS dimensions and backing pixels. Do not create one DOM element per cell.

- [x] **Step 5: Add accessible keyboard and announcement behavior**

The focusable canvas wrapper uses `role="grid"`, `tabIndex={0}`, `aria-rowcount={8}`, `aria-colcount={measureCount * 16}`, and `aria-activedescendant` pointing to one visually hidden active `role="gridcell"`. The active cell exposes matching `aria-rowindex`, `aria-colindex`, instrument name and note state. A separate visually hidden `aria-live="polite"` region announces messages such as “Snare，第 2 小节，第 3 拍第 2 格，已添加音符”.

- [x] **Step 6: Run verification**

Run: `npm test -- src/features/editor/domain/rhythmGridGeometry.test.ts src/features/editor/components/RhythmGridCanvas.test.tsx && npm run typecheck && npm run build && git diff --check`  
Expected: geometry, pointer, keyboard and DPR tests pass.

- [x] **Step 7: Manual gate, memory-bank update, and commit**

Manual check at DPR 1 and 2: add/remove notes at first and last cell; keyboard across row/measure boundaries; horizontal scrolling must not continuously draw. After approval, document Canvas/DOM accessibility boundary.

```bash
git add src/features/editor/domain/rhythmGridGeometry* src/features/editor/components/RhythmGridCanvas* src/index.css memory-bank
git commit -m "Add accessible canvas rhythm grid"
```

---

### Task 5: Editor Route, Document UI, Measures, Tracks, and Responsive Shell

**Deliverable:** 第四个 Tab 可进入完整但静音的编辑器，文档、Grid、小节、Undo/Redo、Mute/Solo 和自动保存 UI 全部可用。

**Files:**
- Create: `src/pages/Editor/EditorPage.tsx`
- Create: `src/pages/Editor/EditorPage.test.tsx`
- Create: `src/features/editor/components/EditorToolbar.tsx`
- Create: `src/features/editor/components/EditorToolbar.test.tsx`
- Create: `src/features/editor/components/MeasureControls.tsx`
- Create: `src/features/editor/components/TrackControlPanel.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/components/BottomNavigation/BottomNavigation.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `RhythmDocumentRepository`, `useEditorStore`, autosave hook, rhythm commands and `RhythmGridCanvas`.
- Produces: `/editor` route and `编辑` primary navigation link.

- [x] **Step 1: Write failing route and navigation tests**

Extend route cases with `['/editor', '节奏编辑器']`, expect four accessible navigation links, click “编辑”, and assert `aria-current="page"`.

Run: `npm test -- src/app/App.test.tsx`  
Expected: FAIL because `/editor` redirects and only three links exist.

- [x] **Step 2: Add the Editor route and fourth navigation item**

Add `SquarePen` or the existing icon-system equivalent with label “编辑”. Keep Timer as the only route that hides bottom navigation.

- [x] **Step 3: Write failing page and toolbar tests**

Seed two documents and assert: last document opens; switching calls autosave flush and clears history; new/rename/delete flows update the selector; delete requires confirmation; final deletion creates “未命名节奏”; save state text is visible; unavailable future features are absent.

- [x] **Step 4: Implement EditorToolbar and document dialogs**

Use explicit callbacks:

```typescript
interface EditorToolbarProps {
  documents: RhythmDocument[];
  activeDocument: RhythmDocument;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
  onSelectDocument(id: string): Promise<void>;
  onCreateDocument(): Promise<void>;
  onRenameDocument(name: string): Promise<void>;
  onDeleteDocument(): Promise<void>;
  onUndo(): void;
  onRedo(): void;
  onRetrySave(): Promise<void>;
}
```

Rename rejects an empty trimmed name. Delete and destructive clear actions use focus-managed confirmation dialogs.

- [x] **Step 5: Implement measure and track controls**

`MeasureControls` exposes selected measure, add, delete, clear current and clear all. `TrackControlPanel` renders exactly 8 rows with Chinese/English instrument labels and 44px Mute/Solo buttons. Boundary controls explain why they are disabled.

- [x] **Step 6: Compose EditorPage**

On mount resolve the initial document, open it in the store, and load the list. On document switch: stop future audio through an injected no-op callback for now, `await flush()`, remember the id, open the new document, and clear history. Use repository injection props in tests to avoid the production database.

- [x] **Step 7: Add responsive styles**

Use `.app-shell--editor` to remove the 720px content cap only for `/editor`. Desktop/tablet uses toolbar + fixed track column + scrollable Canvas; phone keeps the track column visible and scrolls only `.editor-grid-scroll`. Do not add Library or score placeholders.

- [x] **Step 8: Run verification**

Run: `npm test -- src/app/App.test.tsx src/pages/Editor/EditorPage.test.tsx src/features/editor/components/EditorToolbar.test.tsx && npm run typecheck && npm run build && git diff --check`  
Expected: editor route, four-tab navigation, CRUD, editing, history and save-status tests pass.

- [x] **Step 9: Manual gate, memory-bank update, and commit**

Manual check at 390x844, 1024x768 landscape and 1440x900: document CRUD, 16-measure horizontal scrolling, fixed track labels, keyboard editing and no whole-page horizontal overflow. After approval, document route and responsive composition.

```bash
git add src/app src/components/BottomNavigation src/pages/Editor src/features/editor/components src/index.css memory-bank
git commit -m "Add responsive grid editor page"
```

---

### Task 6: Licensed Drum Samples and Web Audio Engine

**Deliverable:** 独立音频引擎能加载 8 个本地采样，并用可测试的音频时钟准确调度节奏；尚不连接页面 Transport。

**Files:**
- Create: `public/audio/drum-kit/LICENSE.md`
- Create: `public/audio/drum-kit/hi-hat.wav`
- Create: `public/audio/drum-kit/snare.wav`
- Create: `public/audio/drum-kit/kick.wav`
- Create: `public/audio/drum-kit/tom-1.wav`
- Create: `public/audio/drum-kit/tom-2.wav`
- Create: `public/audio/drum-kit/tom-3.wav`
- Create: `public/audio/drum-kit/ride.wav`
- Create: `public/audio/drum-kit/crash.wav`
- Create: `src/features/editor/audio/sampleManifest.ts`
- Create: `src/features/editor/audio/RhythmAudioEngine.ts`
- Create: `src/features/editor/audio/RhythmAudioEngine.test.ts`

**Interfaces:**
- Produces: `SAMPLE_MANIFEST: Record<RhythmTrackId, SampleDefinition>`.
- Produces: class `RhythmAudioEngine` with `load`, `play`, `pause`, `stop`, `setDocument`, `setBpm`, `setLoop`, `setVolume`, `getPlayheadTick`, `subscribe`, `dispose`.

- [x] **Step 1: Add the sample license record before binaries**

`LICENSE.md` must list source URL or original creator, exact license, modification status, retrieval date and filename mapping. Only project-owned, public-domain or license-compatible redistributable samples may be added. Do not commit assets with unknown terms.

- [x] **Step 2: Add the eight normalized local samples**

Use mono or stereo WAV files with consistent sample rate where practical; trim leading silence so scheduled onset is audible at the requested time. Keep filenames exactly aligned with the target file list.

- [x] **Step 3: Define a base-path-safe manifest**

```typescript
export const SAMPLE_MANIFEST: Record<RhythmTrackId, SampleDefinition> = {
  "hi-hat": { label: "Hi-Hat", url: `${import.meta.env.BASE_URL}audio/drum-kit/hi-hat.wav` },
  snare: { label: "Snare", url: `${import.meta.env.BASE_URL}audio/drum-kit/snare.wav` },
  kick: { label: "Kick", url: `${import.meta.env.BASE_URL}audio/drum-kit/kick.wav` },
  "tom-1": { label: "Tom 1", url: `${import.meta.env.BASE_URL}audio/drum-kit/tom-1.wav` },
  "tom-2": { label: "Tom 2", url: `${import.meta.env.BASE_URL}audio/drum-kit/tom-2.wav` },
  "tom-3": { label: "Tom 3", url: `${import.meta.env.BASE_URL}audio/drum-kit/tom-3.wav` },
  ride: { label: "Ride", url: `${import.meta.env.BASE_URL}audio/drum-kit/ride.wav` },
  crash: { label: "Crash", url: `${import.meta.env.BASE_URL}audio/drum-kit/crash.wav` },
};
```

- [x] **Step 4: Write failing Audio Engine tests using fakes**

Create fake `AudioContext`, `AudioBufferSourceNode`, `GainNode`, fetch and controllable clock. Assert: eight buffers load once; missing sample reports its track; play schedules notes in `[currentTime, currentTime + 0.1]`; order follows tick then track; velocity affects per-source gain; pause preserves Tick; stop cancels sources and returns Tick 0; loop wraps at document end; non-loop stops; dispose clears timer and nodes.

- [x] **Step 5: Implement engine dependency injection**

```typescript
interface RhythmAudioEngineDependencies {
  createAudioContext(): AudioContext;
  fetchSample(url: string): Promise<ArrayBuffer>;
  setInterval(callback: () => void, ms: number): number;
  clearInterval(id: number): void;
}

export class RhythmAudioEngine {
  constructor(dependencies?: Partial<RhythmAudioEngineDependencies>);
  load(): Promise<void>;
  play(document: RhythmDocument, startTick?: number): Promise<void>;
  pause(): number;
  stop(): void;
  setDocument(document: RhythmDocument): void;
  setBpm(bpm: number): void;
  setLoop(loop: boolean): void;
  setVolume(volume: number): void;
  getPlayheadTick(): number;
  subscribe(listener: (state: AudioEngineState) => void): () => void;
  dispose(): void;
}
```

Use a 25ms scheduler interval and 100ms schedule-ahead window. Use `AudioContext.currentTime` for onset calculation; the interval only wakes the scheduler.

- [x] **Step 6: Implement Mute/Solo and live document changes**

Before each scheduling pass, derive audible tracks from the latest document. Never cancel audio already inside the 100ms window solely because BPM/Mute/Solo changed; changes apply to newly scheduled notes.

- [x] **Step 7: Run verification**

Run: `npm test -- src/features/editor/audio/RhythmAudioEngine.test.ts && npm run typecheck && npm run build && git diff --check`  
Expected: deterministic fake-clock tests pass; build copies all eight WAV files.

- [x] **Step 8: Manual gate, memory-bank update, and commit**

Manual check in Chrome/Safari-compatible browser: first click resumes AudioContext; every track has distinct sound; repeated start/stop does not duplicate timers; tab backgrounding followed by stop leaves silence. Review license file before approval.

```bash
git add public/audio/drum-kit src/features/editor/audio memory-bank
git commit -m "Add local drum samples and audio engine"
```

---

### Task 7: Transport, Playhead, and Live Mute/Solo Integration

**Deliverable:** 编辑器完成真实播放闭环，Transport、播放头、BPM、循环、音量和轨道控制均连接 Audio Engine。

**Files:**
- Create: `src/features/editor/components/TransportControls.tsx`
- Create: `src/features/editor/components/TransportControls.test.tsx`
- Create: `src/features/editor/hooks/useEditorAudio.ts`
- Create: `src/features/editor/hooks/useEditorAudio.test.tsx`
- Modify: `src/pages/Editor/EditorPage.tsx`
- Modify: `src/pages/Editor/EditorPage.test.tsx`
- Modify: `src/features/editor/components/TrackControlPanel.tsx`
- Modify: `src/features/editor/components/RhythmGridCanvas.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `RhythmAudioEngine` and current `RhythmDocument`.
- Produces: `useEditorAudio(document)` returning status, playhead Tick, load error and Transport actions.

- [ ] **Step 1: Write failing Transport tests**

Assert accessible controls for play, pause, stop, BPM, loop and volume; BPM clamps/rejects outside 40–240; pause replaces play while running; stop is disabled at Tick 0; loading disables play; a named sample error identifies the failed track.

- [ ] **Step 2: Implement TransportControls as a controlled component**

```typescript
interface TransportControlsProps {
  status: "loading" | "ready" | "playing" | "paused" | "error";
  bpm: number;
  loop: boolean;
  volume: number;
  error?: string;
  onPlay(): void;
  onPause(): void;
  onStop(): void;
  onBpmChange(bpm: number): void;
  onLoopChange(loop: boolean): void;
  onVolumeChange(volume: number): void;
}
```

Use Chinese `aria-label`s and visible value text. Volume range is 0–1; UI may display 0–100%.

- [ ] **Step 3: Write failing hook lifecycle tests**

With an injected fake engine, assert: mount loads once; play forwards current document; document updates call `setDocument`; switching document stops; `visibilitychange` to hidden stops; unmount disposes; subscription updates playhead; requestAnimationFrame is used only for visual polling.

- [ ] **Step 4: Implement useEditorAudio**

The hook owns one engine instance per mounted EditorPage. It reports load errors without blocking Grid operations. It stops before document switch and on `document.visibilityState === "hidden"`.

- [ ] **Step 5: Connect document changes and track controls**

BPM and Mute/Solo update the current document through `replaceDocumentWithoutHistory`, auto-save, and immediately call engine setters. Grid edits remain undoable; mixer and tempo changes do not enter the Grid Undo stack.

- [ ] **Step 6: Connect the playhead**

Pass `playheadTick` to `RhythmGridCanvas`. Stop resets it to 0; pause freezes it; loop visibly returns to 0. Do not auto-scroll the Grid in V0.4.0.

- [ ] **Step 7: Run verification**

Run: `npm test -- src/features/editor/components/TransportControls.test.tsx src/features/editor/hooks/useEditorAudio.test.tsx src/pages/Editor/EditorPage.test.tsx && npm run typecheck && npm run build && git diff --check`  
Expected: full controlled Transport and lifecycle tests pass.

- [ ] **Step 8: Manual gate, memory-bank update, and commit**

Manual sequence: enter notes on all tracks; play/pause/resume/stop; change BPM while playing; toggle loop; adjust volume; test individual Mute and multiple Solo; navigate to Today and confirm immediate silence. After approval, document audio lifecycle and UI boundary.

```bash
git add src/features/editor/components src/features/editor/hooks src/pages/Editor src/index.css memory-bank
git commit -m "Connect editor transport and playback"
```

---

### Task 8: PWA Precaching, Responsive Browser Tests, and Offline Playback

**Deliverable:** 生产 PWA 在手机、平板横屏和桌面可用，安装后离线加载全部采样并完成编辑播放。

**Files:**
- Modify: `vite.config.ts`
- Modify: `tests/pwa-assets.test.ts`
- Modify: `tests/app-shell.e2e.ts`
- Create: `tests/editor.e2e.ts`
- Modify: `playwright.config.ts` only if a named tablet/desktop project is required
- Modify: `src/index.css`

**Interfaces:**
- Consumes: completed `/editor` UI and local audio assets.
- Produces: browser acceptance coverage and Workbox inclusion for `.wav` files.

- [ ] **Step 1: Write failing PWA asset test**

Require WAV glob support and all eight files with non-zero size:

```typescript
expect(config).toContain("**/*.{js,css,html,png,wav,woff2}");
for (const fileName of expectedSamples) {
  expect((await readFile(resolve("public/audio/drum-kit", fileName))).byteLength).toBeGreaterThan(0);
}
```

- [ ] **Step 2: Update Workbox glob patterns**

Change only the asset extension glob to include `wav`; preserve configurable base path and `navigateFallback`.

- [ ] **Step 3: Write editor E2E tests**

Cover exact journeys:

1. Navigate using the fourth Tab and verify active state.
2. Create, rename, edit, reload and recover a document.
3. Add notes in first and sixteenth Step; Undo/Redo them.
4. Add to 16 measures; verify seventeenth is disabled; delete selected measure with confirmation.
5. Play/pause/stop using a browser AudioContext smoke test; verify playhead state changes without asserting waveform quality.
6. Mute Kick and Solo Snare; verify UI state persists after reload.
7. Switch to Today while playing and verify Transport state is stopped on return.

- [ ] **Step 4: Add viewport assertions**

Run the editor journey at 390x844, 1024x768 and 1440x900. Assert the document body does not overflow; at mobile width only `.editor-grid-scroll` has greater scroll width, and the track column remains within the viewport.

- [ ] **Step 5: Add offline acceptance**

Load once online, wait for service worker readiness, switch the Playwright context offline, reload `/editor`, edit a note, reload again and start playback. Expect document persistence and no failed sample request.

- [ ] **Step 6: Run verification**

Run: `npm test -- tests/pwa-assets.test.ts && npm run build && npm run test:ui && git diff --check`  
Expected: unit and Playwright suites exit 0; `dist/` contains versioned audio assets or precache entries; offline test passes.

- [ ] **Step 7: Manual gate, memory-bank update, and commit**

Manual PWA check: install or launch standalone, go offline, create/edit/reload/play at all three target widths. After approval, record PWA audio caching and responsive constraints.

```bash
git add vite.config.ts tests playwright.config.ts src/index.css memory-bank
git commit -m "Verify offline responsive rhythm editor"
```

---

### Task 9: Full Regression, Prototype Comparison, and V0.4.0 Release Documentation

**Deliverable:** V0.4.0 满足设计规范，V0.3 全部流程无回归，架构和过程文档反映最终事实。

**Files:**
- Modify: `docs/V0.4/implementation-plan-v0.4.0.md` checkbox status only during execution
- Modify: `memory-bank/arch.md`
- Modify: `memory-bank/process.md`
- Modify: affected tests or styles only when a verified acceptance defect requires it

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified V0.4.0 release candidate and final architecture record.

- [ ] **Step 1: Build a requirement-to-test checklist**

Map every section of `SnareLab_Grid_Editor_v0.4.0_Design_Spec.md` to at least one automated or manual check. Explicitly prove non-goals are absent: no Library, score, Count-in, metronome, multi-kit, variable subdivision, track CRUD or PracticeSession write.

- [ ] **Step 2: Run the complete automated suite**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run test:ui
git diff --check
```

Expected: every command exits 0; no required test is skipped; production build contains the PWA manifest, service worker and drum samples.

- [ ] **Step 3: Run V0.3 regression manually**

Verify Today, timer start/pause/save, pending draft, image attachment, records filtering/detail editing/hard delete, category/tag settings and annual/month/day statistics. Confirm the four-tab navigation does not alter existing data or page layouts.

- [ ] **Step 4: Run V0.4.0 acceptance manually**

Verify multiple documents, autosave statuses, 1–16 measures, all 8 tracks, first/last cells, keyboard editing, 100-history behavior, destructive confirmations, playback timing, pause/resume, stop, loop, BPM 40/240 boundaries, volume, Mute/Solo, route/background stop, three viewport layouts and offline playback.

- [ ] **Step 5: Update memory-bank to final implementation facts**

`arch.md` must describe schema v5, repository/store/Canvas/audio boundaries, sample licensing location, responsive shell and Practice Log isolation. `process.md` must list commands, results, manual devices/viewports, known non-goals and final acceptance date.

- [ ] **Step 6: Final commit**

```bash
git add docs/V0.4 memory-bank src public tests vite.config.ts package.json package-lock.json
git commit -m "Release SnareLab Grid Editor v0.4.0"
```

---

## Final Acceptance Checklist

- [ ] 主导航显示“今日 / 记录 / 统计 / 编辑”，`/editor` 可直接打开。
- [ ] 首次进入创建“未命名节奏”，后续恢复上次有效文档。
- [ ] 文档可新建、打开、重命名、删除并自动保存。
- [ ] 保存失败保留内存编辑并提供重试。
- [ ] Grid 固定 4/4、16 分 Step、8 轨、1–16 小节。
- [ ] 鼠标、触摸和键盘均可添加/删除普通音符。
- [ ] 小节删除会移除本节音符并正确前移后续 Tick。
- [ ] Undo/Redo 覆盖规定操作并限制为 100 个历史状态。
- [ ] 8 个本地采样具有明确授权记录并能离线加载。
- [ ] Web Audio 使用音频时钟和 look-ahead scheduler 调度。
- [ ] 播放、暂停、停止、40–240 BPM、循环、播放头和主音量正确。
- [ ] Mute/Solo 真实影响播放并随文档保存。
- [ ] 切换文档、Tab、后台或卸载页面会停止音频。
- [ ] 手机只横向滚动 Grid，平板横屏和桌面使用宽屏工作台。
- [ ] Figure、五线谱、Count-in、节拍器和多音色不出现在首版 UI。
- [ ] 编辑器不会新增或修改 PracticeSession，也不影响现有统计。
- [ ] Dexie v5 升级保留全部 V0.3 数据。
- [ ] V0.3 单元、组件、浏览器和 PWA 回归测试全部通过。
- [ ] `memory-bank/arch.md` 与 `memory-bank/process.md` 已更新为最终事实。

## Execution Rule

严格一次只实施一个 Task。每个 Task 完成自动验证后停止，向车老板说明本次交付和建议手动验收范围；只有收到明确“验证通过”，才能更新 memory-bank、提交该 Task 并开始下一项。
