# SnareLab 设计文档 V1.0

> 产品名：Snare Practice Lab / SnareLab  
> 文档类型：Engineering Design Document  
> MVP 范围：Phase 0-5，其中 Phase 5 仅包含轻量练习记录闭环  
> 主要依据：`SnareLab-PRD-and-Plan-V1.0.md`、`SnareLab-ui-spec/`、`SnareLab-rhythm-catalog/`

## 1. 产品定位与 MVP 边界

SnareLab 是一个本地优先的个人架子鼓练习系统，第一阶段聚焦军鼓节奏训练。产品不是教学后台，也不是单纯节拍器，而是围绕个人练习闭环设计的浏览器端工具：

```text
首页继续练习
-> 选择节奏型
-> 编排或生成练习
-> 看谱跟练
-> 调整 BPM
-> 自动记录 session
-> 写练习笔记 / 简单回顾
-> 下次继续
```

MVP 必须覆盖：

- 深色练习驾驶舱 UI 与响应式布局。
- React SPA 工程基础、路由、基础组件与设计 token。
- 24 个基础节奏型：16 个十六分音符 pattern，8 个三连音 pattern。
- 节奏型卡片、多选、练习队列、随机 / 顺序 / 每轮重洗。
- 跟练页播放控制、BPM 控制、声音层、简化谱面或 VexFlow 谱面。
- 自动 PracticeSession 记录。
- 个人目标、练习笔记、问题记录、练习回顾的轻量闭环。
- 本地 IndexedDB 存储和 JSON 导入导出能力。

MVP 不做：

- 账号系统、云同步、老师端、教学后台。
- MIDI 准确度评分、麦克风识别、AI 转写。
- 套鼓谱、商业曲库、排行榜。
- 长按音符局部编辑。该能力保留为 Phase 6+。
- 复杂统计分析。Phase 5 只做最近练习、本周轻量进度、简单回顾。

正式术语使用：

- 个人目标
- 练习笔记
- 问题记录
- 练习回顾
- 当前 Focus
- 下一步建议

避免使用：

- 课堂作业
- 上课记录
- 课题
- 老师反馈
- 教学后台

## 2. 技术栈与工程形态

### 2.1 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | React + TypeScript |
| 构建工具 | Vite |
| 路由 | React Router |
| 状态管理 | Zustand |
| 本地数据库 | IndexedDB + Dexie |
| 音频 | Web Audio API |
| 播放调度 | Web Audio lookahead scheduler |
| 谱面渲染 | ScoreRenderer 抽象，MVP 可用 SVG/HTML，预留 VexFlow |
| 记谱库 | VexFlow |
| 样式 | CSS Modules 或 Tailwind，必须落地统一 token |
| 后续 MIDI | Web MIDI API |

### 2.2 SPA 路由

正式工程采用 SPA，不沿用原型的多 HTML 页面。原型文件仅作为 UI 和交互参考。

| 路由 | 页面 | 说明 |
|---|---|---|
| `/home` | 首页 | 个人练习驾驶舱 |
| `/rhythm` | 节奏页 | 节奏型选择与练习编排 |
| `/trainer` | 跟练页 | 谱面、播放、BPM、session 记录 |
| `/library` | 练习库 | 可复用练习资产 |
| `/log` | 日志页 | 练习记录、笔记、目标、回顾 |
| `/settings` | 设置页 | 声音、播放、数据导入导出 |

默认根路径 `/` 重定向到 `/home`。

### 2.3 架构分层

```text
src/
├── app/                 # 路由、AppShell、Provider
├── pages/               # home/rhythm/trainer/library/log/settings
├── components/          # 基础 UI 与业务组件
├── features/            # rhythm/trainer/library/log/settings 领域逻辑
├── catalog/             # 节奏目录与模板
├── db/                  # Dexie schema、repository
├── stores/              # Zustand stores
├── audio/               # AudioScheduler、声音层、采样/合成
├── score/               # ScoreRenderer 抽象与实现
├── services/            # SessionService、CatalogService 等
├── types/               # 共享类型
└── styles/              # token、全局样式、响应式规则
```

设计原则：

- 页面层只编排数据和组件，不直接操作 IndexedDB、Web Audio 或渲染细节。
- 业务状态进入 Zustand，持久化数据进入 Dexie。
- 谱面渲染只能通过 ScoreRenderer 调用，不能在 Trainer 业务组件中写死临时 HTML 谱面。
- 音频播放只能通过 AudioScheduler 调用，不能在 UI 组件中直接调 Web Audio 节点。

## 3. UI 与响应式设计

### 3.1 视觉基准

UI 以 `SnareLab-ui-spec/` 为视觉参考，保持深色练习驾驶舱风格：

| Token | 值 | 用途 |
|---|---|---|
| `--bg` | `#080B10` | 主背景 |
| `--side` | `#070A0F` | 侧边栏背景 |
| `--panel` | `#111722` | 主卡片 |
| `--panel2` | `#151D2B` | 次级卡片 |
| `--panel3` | `#1A2433` | 激活背景 |
| `--line` | `#28364A` | 卡片描边 |
| `--line2` | `#34455F` | 控件描边 |
| `--text` | `#E8EEF8` | 主文字 |
| `--muted` | `#95A3B8` | 辅助文字 |
| `--accent` | `#FFB020` | 主强调色 |
| `--accent2` | `#FFD36C` | 强调 hover / 高亮 |
| `--red` | `#FF5A7A` | 播放线 / 警示 |
| `--green` | `#7CFFCB` | 完成 / 正向状态 |
| `--blue` | `#6CA7FF` | 播放 / 次级操作 |

基础组件：

- `AppShell`
- `Sidebar`
- `BottomNav`
- `Card`
- `Button`
- `Badge`
- `Tabs`
- `Segment`
- `Switch`
- `Input`
- `Textarea`
- `Modal`
- `ConfirmDialog`

业务组件：

- `HeroContinueCard`
- `QuickActionCard`
- `GoalList`
- `RecentSessionList`
- `ProgressCard`
- `PatternCard`
- `PatternGrid`
- `PracticeQueue`
- `StaffViewer`
- `PlaybackControls`
- `BpmControl`
- `AudioLayerSwitches`
- `ExerciseList`
- `ExerciseDetail`
- `LogItem`
- `NoteEditor`
- `GoalForm`

### 3.2 响应式规则

| 屏幕类型 | 布局策略 |
|---|---|
| 桌面大屏 | 左侧完整导航 + 主内容多栏 |
| 平板横屏 | 左侧导航 + 主区域双栏 |
| 平板竖屏 | 主内容单栏，设置模块上移 |
| 小屏幕 | 底部导航 + 卡片纵向堆叠 |

视觉风格不随屏幕改变，只调整布局、密度和导航形态。

## 4. 数据模型

### 4.1 RhythmPattern

`RhythmPattern` 来自节奏目录，是节奏型选择、谱面渲染、播放调度和后续 MIDI ground truth 的共同基础。

```ts
type Subdivision = 'sixteenth' | 'triplet'
type PatternDifficulty = 1 | 2 | 3 | 4 | 5

type PatternAtom = {
  slotIndex: number
  kind: 'note' | 'rest'
  duration: '16' | '8'
}

type RhythmPattern = {
  id: string
  code: string
  name: string
  displayNameZh: string
  subdivision: Subdivision
  slotLabels: string[]
  steps: boolean[]
  hitCount: string
  difficulty: PatternDifficulty
  tags: string[]
  ui: {
    cardSize: 'pattern-card'
    cardFallbackGlyph: string
    dotStates: Array<'hit' | 'rest'>
    defaultState: 'default'
    selectedState: 'yellow-outline-dark-gold-fill'
    disabledState: 'opacity-42-dashed-border'
    currentPlaybackState: 'red-playhead-yellow-beat-dot'
  }
  render: {
    engine: 'vexflow'
    staff: 'percussion-one-line'
    card: {
      mode: 'compact-score-preview'
      showRests: 'minimal'
      showDots: boolean
      fallbackGlyph: string
    }
    score: {
      mode: 'precise'
      atoms: PatternAtom[]
      beamGroup: boolean
      tuplet: null | { actualNotes: 3; normalNotes: 2 }
    }
    playback: {
      gridUnit: Subdivision
      hitSlots: number[]
      restSlots: number[]
    }
  }
}
```

### 4.2 StarterPracticeTemplate

```ts
type StarterPracticeTemplate = {
  id: string
  displayNameZh: string
  description: string
  patternIds: string[]
  modeSuggestion: PracticeMode
  difficulty: PatternDifficulty
  tags: string[]
}
```

`rhythm-pattern-catalog.v1.ts` 是开发期权威数据源。`rhythm-pattern-catalog.v1.json` 是导出、调试和未来外部配置格式，应通过脚本从 TypeScript catalog 同步生成，避免双源分歧。

### 4.3 PracticeQueue

```ts
type PracticeMode = 'shuffle' | 'ordered' | 'reshuffle-each-round' | 'endless'
type TimeSignature = '2/4' | '3/4' | '4/4'

type PracticeQueue = {
  id: string
  title: string
  patternIds: string[]
  mode: PracticeMode
  bars: number
  timeSignature: TimeSignature
  defaultBpm: number
  tags: string[]
  source: 'manual' | 'template' | 'goal' | 'generated'
  createdAt: string
  updatedAt: string
}
```

### 4.4 GeneratedExercise

`GeneratedExercise` 是进入跟练页的稳定输入。它由 queue 和 pattern catalog 生成，保存实际小节顺序。

```ts
type ExerciseSource = 'preset' | 'generated' | 'manual' | 'goal' | 'favorite'

type ExerciseBeat = {
  beatIndex: number
  patternId: string
}

type ExerciseBar = {
  barIndex: number
  beats: ExerciseBeat[]
}

type GeneratedExercise = {
  id: string
  title: string
  source: ExerciseSource
  queueId?: string
  goalId?: string
  mode: PracticeMode
  timeSignature: TimeSignature
  bars: ExerciseBar[]
  defaultBpm: number
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}
```

### 4.5 PracticeSession

```ts
type PracticeSessionStatus = 'active' | 'paused' | 'completed' | 'abandoned'

type AudioLayerState = {
  metronome: boolean
  demoDrum: boolean
  accent: boolean
  subdivision: boolean
  countIn: boolean
}

type PracticeSession = {
  id: string
  exerciseId?: string
  queueId?: string
  goalId?: string
  startedAt: string
  endedAt?: string
  status: PracticeSessionStatus
  bpm: number
  bpmMin?: number
  bpmMax?: number
  durationSeconds: number
  mode: PracticeMode
  completedRepeats?: number
  audioLayers: AudioLayerState
  difficultyRating?: 1 | 2 | 3 | 4 | 5
  feelingRating?: 1 | 2 | 3 | 4 | 5
  review?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

Session 规则：

- 点击开始播放时，如果当前没有 active session，则自动创建。
- 暂停只更新 `status` 和 `durationSeconds`，不结束 session。
- 继续播放将 session 恢复为 `active`。
- 用户点击结束、切换练习、离开 `/trainer` 时结束 session。
- 结束后可打开轻量回顾弹窗，保存主观难度、感受评分和文字回顾。

### 4.6 PersonalGoal

```ts
type GoalStatus = 'not-started' | 'in-progress' | 'review' | 'done' | 'paused'

type PersonalGoal = {
  id: string
  title: string
  description?: string
  status: GoalStatus
  targetBpm?: number
  linkedPatternIds: string[]
  linkedQueueIds: string[]
  linkedExerciseIds: string[]
  tags: string[]
  dueDate?: string
  weeklyTargetCount?: number
  targetRepeats?: number
  createdAt: string
  updatedAt: string
}
```

### 4.7 PracticeNote

```ts
type PracticeNoteType = 'note' | 'problem' | 'review' | 'idea'

type PracticeNote = {
  id: string
  title: string
  content: string
  type: PracticeNoteType
  linkedGoalIds: string[]
  linkedSessionIds: string[]
  linkedExerciseIds: string[]
  linkedPatternIds: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}
```

### 4.8 UserSettings

```ts
type UserSettings = {
  id: 'default'
  defaultBpm: number
  defaultAudioLayers: AudioLayerState
  defaultTimeSignature: TimeSignature
  defaultBars: number
  countInBeats: 1 | 2 | 4
  updatedAt: string
}
```

## 5. 本地存储设计

Dexie 数据库名建议为 `snarelab`.

| 表 | 主键 / 索引 | 说明 |
|---|---|---|
| `patterns` | `id, subdivision, difficulty` | 可选，只读镜像或运行时缓存 |
| `practiceQueues` | `id, mode, updatedAt` | 用户保存的练习队列 |
| `exercises` | `id, source, queueId, goalId, updatedAt` | 可跟练练习 |
| `sessions` | `id, exerciseId, goalId, startedAt, status` | 自动练习记录 |
| `goals` | `id, status, updatedAt, dueDate` | 个人目标 |
| `notes` | `id, type, updatedAt` | 练习笔记、问题记录、回顾 |
| `settings` | `id` | 用户设置 |

Repository 职责：

- `CatalogRepository` 读取内置 catalog，必要时同步到 `patterns`。
- `PracticeQueueRepository` 保存、读取、删除队列。
- `ExerciseRepository` 保存生成练习和用户练习。
- `SessionRepository` 提供 session 的 start/update/end 持久化。
- `GoalRepository` 管理个人目标和状态。
- `NoteRepository` 管理练习笔记、问题记录、练习回顾。
- `SettingsRepository` 读取和更新默认设置。

数据导入导出：

- 导出 JSON 包含 queues、exercises、sessions、goals、notes、settings。
- 导入时不覆盖内置 rhythm catalog。
- 清空缓存必须二次确认，并保留当前版本的内置 catalog。

## 6. 状态管理设计

### 6.1 useRhythmStore

职责：

- 当前分类：十六分、三连音、我的收藏。
- 当前选择的 `patternIds`。
- 收藏状态。
- pattern 过滤与搜索状态。

不负责：

- 保存练习队列。
- 播放状态。
- session 记录。

### 6.2 usePracticeQueueStore

职责：

- 当前队列 pattern 顺序。
- 当前练习模式：随机、顺序、每轮重洗、无尽。
- 拍号、小节数、默认 BPM。
- 生成 `GeneratedExercise`。
- 保存队列为练习或关联个人目标。

### 6.3 useTrainerStore

职责：

- 当前 exercise。
- 播放状态：idle、count-in、playing、paused、ended。
- 当前 BPM。
- 当前小节、当前拍、当前 subdivision slot。
- 声音层开关。
- 当前 active session id。

### 6.4 useLogStore

职责：

- 最近 sessions。
- 个人目标列表。
- 练习笔记、问题记录、练习回顾。
- 首页轻量聚合数据：本周时长、最近 BPM、当前 Focus、下一步建议。

### 6.5 useSettingsStore

职责：

- 默认 BPM。
- 默认声音层。
- Count-in 拍数。
- 默认拍号和小节数。
- 导入导出状态。

## 7. 关键服务与接口

### 7.1 CatalogService

```ts
type CatalogService = {
  getPatterns(): RhythmPattern[]
  getPatternById(id: string): RhythmPattern | undefined
  getPatternsBySubdivision(subdivision: Subdivision): RhythmPattern[]
  getTemplates(): StarterPracticeTemplate[]
}
```

规则：

- 开发期从 `rhythm-pattern-catalog.v1.ts` 读取。
- JSON 只作为导出、调试或未来外部配置。
- 所有 pattern 渲染、播放和队列生成都以 `steps` 与 `render.playback` 为真实来源。

### 7.2 ExerciseGenerator

```ts
type GenerateExerciseInput = {
  queue: PracticeQueue
  patterns: RhythmPattern[]
}

type ExerciseGenerator = {
  generate(input: GenerateExerciseInput): GeneratedExercise
}
```

生成规则：

- `ordered` 保持队列顺序。
- `shuffle` 生成时随机一次，进入跟练后顺序固定。
- `reshuffle-each-round` 每轮重新生成顺序。
- `endless` 在播放接近末尾时追加后续小节。
- 每个 beat 对应一个 `RhythmPattern`，按拍号组合成小节。

### 7.3 ScoreRenderer

```ts
type PlaybackState = {
  status: 'idle' | 'count-in' | 'playing' | 'paused' | 'ended'
  currentBarIndex: number
  currentBeatIndex: number
  currentSlotIndex: number
  progress: number
}

type ScoreRenderer = {
  render(exercise: GeneratedExercise, playbackState: PlaybackState): React.ReactNode
}
```

MVP 可以提供：

- `HtmlScoreRenderer`：简化 HTML/SVG 谱面，保证可读、可高亮、可显示播放线。
- `VexFlowScoreRenderer`：后续替换实现，使用 `pattern.render.score.atoms` 渲染精确谱面。

限制：

- Trainer 页面不能直接依赖临时 HTML 谱面结构。
- 播放线由全局 beat grid 驱动，不能从视觉坐标反推播放位置。
- 卡片预览可以紧凑渲染；跟练谱面必须以 `render.score.atoms` 为准确来源。

### 7.4 AudioScheduler

```ts
type AudioSchedulerStartInput = {
  bpm: number
  exercise: GeneratedExercise
  layers: AudioLayerState
  onTick: (state: PlaybackState) => void
}

type AudioScheduler = {
  start(input: AudioSchedulerStartInput): void
  pause(): void
  resume(): void
  stop(): void
  setBpm(bpm: number): void
  setLayers(layers: AudioLayerState): void
}
```

调度规则：

- 使用 Web Audio `AudioContext.currentTime` 作为时间基准。
- 使用 lookahead scheduler 提前调度 click、demo drum、accent、subdivision。
- BPM 变化实时影响下一批调度事件。
- Count-in 默认开启，开始播放前先播放预备拍。
- MVP 音色可以是合成音或简单 sample，目标是稳定和清晰，不追求真实鼓音色。

### 7.5 SessionService

```ts
type SessionService = {
  start(input: {
    exerciseId?: string
    queueId?: string
    goalId?: string
    bpm: number
    mode: PracticeMode
    audioLayers: AudioLayerState
  }): Promise<PracticeSession>
  update(id: string, patch: Partial<PracticeSession>): Promise<void>
  end(id: string, patch?: Partial<PracticeSession>): Promise<void>
}
```

规则：

- `start` 在用户首次开始播放时调用。
- 暂停调用 `update`，不调用 `end`。
- 离开 `/trainer`、显式结束、切换 exercise 时调用 `end`。
- 回顾弹窗保存难度、感受、文字总结时更新已结束 session。

## 8. 页面设计与核心流程

### 8.1 `/home`

首页回答“今天该练什么”。

模块：

- 继续上次练习：名称、类型、上次 BPM、上次时长、目标重复次数、建议 BPM。
- 快速入口：随机读谱、顺序目标、新建练习笔记。
- 当前个人目标：标题、目标 BPM、状态、是否可转为顺序练习。
- 最近练习：日期、练习名称、BPM、时长、声音配置、主观难度。
- 本周轻量进度：练习时长、目标完成度、稳定 BPM。
- 当前 Focus：从目标、最近记录和标签聚合。
- 下一步建议：1-3 条可跳转建议。

### 8.2 `/rhythm`

节奏页回答“我要用哪些节奏型练，按什么方式练”。

模块：

- 练习模式 segment：随机、顺序、无尽。
- 拍号 segment：2/4、3/4、4/4。
- 小节数和默认 BPM 设置。
- 分类 Tab：十六分音符、三连音、我的收藏。
- `PatternCard`：音符可视化、名称、击打数量、圆点辅助、选中状态。
- 练习队列：顺序编号、音符预览、圆点辅助。
- 操作：生成练习、保存队列。

交互：

- 点击卡片选中 / 取消选中。
- 队列顺序在 P0 可按选中顺序生成；拖拽排序为 P1。
- 生成练习后进入 `/trainer`。
- 保存队列后可在 `/library` 复用。

### 8.3 `/trainer`

跟练页回答“我现在怎么练、速度多少、打到哪里了”。

模块：

- 谱面区域：ScoreRenderer 输出、红色播放线、当前拍点。
- 播放控制：开始、暂停、继续、重置、结束。
- BPM 控制：当前 BPM、+1/-1、+5/-5、拨盘或等价控件、自动升速 P1。
- 声音层：节拍器、鼓点示范、重音、细分提示、Count-in。
- 练习结束回顾：难度、感受、文字回顾。

自动 session 流程：

```text
打开 trainer
-> 加载 exercise
-> 点击开始
-> SessionService.start
-> Count-in
-> AudioScheduler.start
-> 播放中持续 update duration/bpm/repeats
-> 暂停只 update
-> 结束或离页 SessionService.end
-> 可保存简单回顾
```

### 8.4 `/library`

练习库回答“我保存过哪些练习，要从哪里继续”。

模块：

- 筛选 Tab：全部、预设、生成、自定义、收藏、目标。
- 操作：新建练习、导入 JSON、导出。
- 练习列表：名称、来源、模式、默认 BPM、标签、目标关联。
- 练习详情：来源、拍号、模式、BPM、目标、标签。
- 操作：开始跟练、复制编辑、加入个人目标。

### 8.5 `/log`

日志页沉淀个人练习过程。

模块：

- 快速记录：新建练习笔记、新建个人目标、补记练习。
- 筛选：全部、笔记、问题、回顾。
- 练习记录列表。
- 练习笔记 / 问题记录 / 练习回顾编辑器。
- 个人目标表单。

关联能力：

- 笔记可关联个人目标、session、exercise、pattern。
- 个人目标可关联 pattern、queue、exercise。
- session 可关联 exercise、queue、goal。

### 8.6 `/settings`

设置页管理声音、播放和数据。

模块：

- 默认节拍器、默认鼓点、Count-in。
- 默认 BPM、默认拍号、默认小节数。
- 导入 JSON、导出 JSON。
- 清空本地数据，必须二次确认。
- 响应式策略说明。

## 9. 开发阶段拆分

### Phase 0：项目基础与设计系统

交付：

- Vite + React + TypeScript 工程。
- React Router SPA。
- 设计 token、全局样式、响应式 AppShell。
- 基础组件：Button、Card、Badge、Tabs、Segment、Switch、Input、Modal。
- Dexie 初始化和 settings 默认值。

### Phase 1：首页与个人目标

交付：

- `/home` 页面。
- 当前个人目标列表。
- 最近练习列表空状态。
- 新建个人目标。
- 新建练习笔记入口。

### Phase 2：节奏型库与音符卡片

交付：

- 内置 `rhythm-pattern-catalog.v1.ts`。
- PatternCard、PatternGrid。
- 十六分 / 三连音 / 我的收藏 Tab。
- 多选和收藏。
- CatalogService。

### Phase 3：练习队列与生成器

交付：

- PracticeQueue 组件。
- 随机、顺序、每轮重洗模式。
- 拍号、小节数、默认 BPM。
- ExerciseGenerator。
- 保存队列和生成练习。

### Phase 4：跟练页与音频播放

交付：

- `/trainer` 页面。
- ScoreRenderer 抽象与 MVP 渲染实现。
- AudioScheduler 与 Web Audio lookahead 调度。
- 播放、暂停、继续、重置、结束。
- BPM 调整。
- 声音层开关。
- Count-in。

### Phase 5：轻量练习记录闭环

交付：

- 自动 PracticeSession。
- 练习结束回顾弹窗。
- 最近练习更新。
- `/log` 页面记录列表。
- 练习笔记、问题记录、练习回顾。
- 首页本周轻量进度和下一步建议。

## 10. 验收标准

### 10.1 用户路径验收

必须跑通：

```text
/home
-> 点击调整节奏
-> /rhythm 选择 2 个以上 pattern
-> 生成练习
-> /trainer 点击开始
-> Count-in 后播放
-> 调整 BPM
-> 暂停再继续
-> 结束练习
-> 保存简单回顾
-> /home 和 /log 能看到记录
```

### 10.2 数据验收

- 所有 pattern 来自 TypeScript catalog。
- JSON catalog 不作为开发期权威源。
- 生成练习保存实际 bar/beat 顺序。
- session 开始、暂停、继续、结束均能更新 IndexedDB。
- 离开 `/trainer` 时不会丢失 active session。

### 10.3 UI 验收

- 桌面大屏显示完整侧边栏。
- 小屏幕显示底部导航。
- PatternCard 有音符预览、击打数量、圆点辅助、选中状态。
- Trainer 谱面区域是主视觉中心。
- 播放线使用红色，当前状态明显。
- BPM 是跟练页主控。

### 10.4 音频验收

- Count-in 后开始播放。
- 节拍器、鼓点示范、重音层可独立开关。
- BPM 调整影响后续播放。
- 暂停后播放线和声音同步停止。
- 继续后从当前进度恢复或按当前设计重启当前 beat，行为必须一致。

### 10.5 MVP 边界验收

- 不实现账号、云同步、MIDI 评分、套鼓扩展。
- 不实现长按音符局部编辑。
- 不做复杂统计分析或排行榜。
- 不使用教学后台、课堂作业、课题等术语。

## 11. 后续扩展

### Phase 6+：局部编辑

- 长按音符打开局部编辑浮层。
- 支持改为休止、添加 / 删除重音、设置 R/L、删除音符。
- 编辑结果保存为自定义 exercise。

### Phase 7+：MIDI 输入与评分

- Web MIDI 设备选择。
- MIDI hit 监听。
- 与 `render.playback.hitSlots` 和 beat grid 对齐。
- 输出 early / late、命中率、漏打、多打、稳定性。

### Phase 8+：套鼓扩展

- 新增 `DrumVoiceMapping`。
- 同一 RhythmPattern 映射到 snare、kick、hihat、tom。
- 扩展到 groove 练习库和套鼓谱显示。

## 12. 实现默认值

| 项 | 默认值 |
|---|---|
| 默认路由 | `/home` |
| 默认 BPM | 80 |
| 默认拍号 | `4/4` |
| 默认小节数 | 4 |
| 默认模式 | `shuffle` |
| 默认 Count-in | 开 |
| Count-in 拍数 | 4 |
| 默认节拍器 | 开 |
| 默认鼓点示范 | 开 |
| 默认重音提示 | 关 |
| 默认细分提示 | 关 |
| 默认 session 结束条件 | 显式结束、切换练习、离开 `/trainer` |

