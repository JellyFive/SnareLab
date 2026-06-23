# Snare Practice Lab 节奏型目录规范 V1.0

> 用途：定义节奏型选择页中所有可供选择的基础节奏型。  
> 原则：**标准音符本体 + 深色音符卡片 UI + 圆点辅助 + VexFlow 自动渲染**。  
> 注意：不要把节奏型做成 PNG。开发中应由 `steps` 和 `render.score.atoms` 自动渲染卡片和跟练谱面。

---

## 1. 核心定义

第一版定义两类基础节奏型：

| 类型 | 位置 | 数量 |
|---|---|---:|
| 十六分音符 | `1 e & a` | 16 |
| 三连音 | `1 trip let` | 8 |
| 合计 | 一拍内基础组合 | 24 |

这 24 个是 MVP 阶段“可供选择”的基础节奏词典。  
后续的随机练习、顺序练习、无尽模式、五线谱跟练、MIDI ground truth 都应该复用同一份数据。

---

## 2. 数据模型

```ts
type RhythmPattern = {
  id: string
  code: string
  name: string
  displayNameZh: string
  subdivision: 'sixteenth' | 'triplet'
  slotLabels: string[]
  steps: boolean[]
  hitCount: string
  difficulty: 1 | 2 | 3 | 4 | 5
  tags: string[]
  ui: {
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
      atoms: Array<{ slotIndex: number; kind: 'note' | 'rest'; duration: '16' | '8' }>
      beamGroup: boolean
      tuplet: null | { actualNotes: 3; normalNotes: 2 }
    }
    playback: {
      gridUnit: 'sixteenth' | 'triplet'
      hitSlots: number[]
      restSlots: number[]
    }
  }
}
```

---

## 3. 难度定义

| 难度 | 含义 |
|---:|---|
| 1 | 基础：正拍、连续、完整均分，适合热身 |
| 2 | 入门进阶：后半拍或简单组合，需要基础读谱 |
| 3 | 进阶：切分、缺位、三连弱位，需要反应 |
| 4 | 困难：弱位单击、稀疏进入、容易抢拍或拖拍 |
| 5 | 保留：未来用于跨拍、复杂连线、套鼓声部分离 |

---

## 4. 十六分音符节奏型

位置：`1 e & a`  
渲染规则：每个 slot 用 `16` 或 `16r` 精确渲染。卡片可使用紧凑预览，但播放和评分必须以 `steps` 为准。

| ID | 编码 | 中文名 | 难度 | 标签 | 卡片降级显示 | 渲染规则 |
|---|---|---|---:|---|---|---|
| `sixteenth-0000` | `0000` | 全休止 | 1 | 十六分, 休止, 基础, 静默, 套鼓可复用 | `𝄽` | `R R R R` |
| `sixteenth-1000` | `1000` | 正拍单击 | 1 | 十六分, 正拍, 基础, 读谱, 套鼓可复用 | `♩` | `N R R R` |
| `sixteenth-0100` | `0100` | e 位单击 | 4 | 十六分, 弱位, 反应, 困难, 读谱, 套鼓可复用 | `𝄾𝅘𝅥𝅯` | `R N R R` |
| `sixteenth-0010` | `0010` | & 位单击 | 3 | 十六分, 反拍, 切分, 读谱, 套鼓可复用 | `𝄾𝄾𝅘𝅥𝅯` | `R R N R` |
| `sixteenth-0001` | `0001` | a 位单击 | 4 | 十六分, 弱位, 反应, 困难, 读谱, 套鼓可复用 | `𝄾𝄾𝄾𝅘𝅥𝅯` | `R R R N` |
| `sixteenth-1100` | `1100` | 前八分 | 1 | 十六分, 基础, 连续, 前半拍, 套鼓可复用 | `♫` | `N N R R` |
| `sixteenth-1010` | `1010` | 正拍与反拍 | 2 | 十六分, 基础, 正拍, 反拍, 套鼓可复用 | `♩♪` | `N R N R` |
| `sixteenth-1001` | `1001` | 首尾切分 | 3 | 十六分, 切分, 首尾, 读谱, 套鼓可复用 | `♩𝄾𝅘𝅥𝅯` | `N R R N` |
| `sixteenth-0110` | `0110` | 中间两位 | 3 | 十六分, 弱位, 切分, 读谱, 套鼓可复用 | `𝄾♫` | `R N N R` |
| `sixteenth-0101` | `0101` | 弱位切分 | 4 | 十六分, 弱位, 切分, 困难, 读谱, 套鼓可复用 | `𝄾𝅘𝅥𝅯𝄾𝅘𝅥𝅯` | `R N R N` |
| `sixteenth-0011` | `0011` | 后八分 | 2 | 十六分, 后半拍, 连续, 读谱, 套鼓可复用 | `𝄾♫` | `R R N N` |
| `sixteenth-1110` | `1110` | 前三位 | 2 | 十六分, 连续, 前三位, 读谱, 套鼓可复用 | `♬𝄾` | `N N N R` |
| `sixteenth-1101` | `1101` | 缺反拍 | 3 | 十六分, 切分, 缺位, 进阶, 套鼓可复用 | `♫𝄾𝅘𝅥𝅯` | `N N R N` |
| `sixteenth-1011` | `1011` | 缺 e 位 | 3 | 十六分, 切分, 缺位, 进阶, 套鼓可复用 | `𝅘𝅥𝅯𝄾♫` | `N R N N` |
| `sixteenth-0111` | `0111` | 后三位 | 3 | 十六分, 后半拍, 连续, 进阶, 套鼓可复用 | `𝄾♬` | `R N N N` |
| `sixteenth-1111` | `1111` | 完整十六分 | 1 | 十六分, 基础, 连续, 均分, 套鼓可复用 | `♬` | `N N N N` |

---

## 5. 三连音节奏型

位置：`1 trip let`  
渲染规则：每个 slot 用三连音组内的 `8` 或 `8r` 渲染，并使用 tuplet `{
actualNotes: 3,
normalNotes: 2
}`。

| ID | 编码 | 中文名 | 难度 | 标签 | 卡片降级显示 | 渲染规则 |
|---|---|---|---:|---|---|---|
| `triplet-000` | `000` | 三连音全休止 | 1 | 三连音, 休止, 基础, 静默, 套鼓可复用 | `𝄽` | `R R R` |
| `triplet-100` | `100` | 三连音第 1 位 | 1 | 三连音, 正拍, 基础, 读谱, 套鼓可复用 | `♩` | `N R R` |
| `triplet-010` | `010` | Trip 位单击 | 3 | 三连音, 弱位, 反应, 读谱, 套鼓可复用 | `𝄾♪` | `R N R` |
| `triplet-001` | `001` | Let 位单击 | 3 | 三连音, 弱位, 后位, 读谱, 套鼓可复用 | `𝄾𝄾♪` | `R R N` |
| `triplet-110` | `110` | 三连音前两位 | 2 | 三连音, 连续, 前两位, 基础, 套鼓可复用 | `♪♪𝄾` | `N N R` |
| `triplet-101` | `101` | 三连音首尾 | 3 | 三连音, 切分, 首尾, 进阶, 套鼓可复用 | `♪𝄾♪` | `N R N` |
| `triplet-011` | `011` | 三连音后两位 | 3 | 三连音, 后两位, 连续, 读谱, 套鼓可复用 | `𝄾♪♪` | `R N N` |
| `triplet-111` | `111` | 完整三连音 | 1 | 三连音, 基础, 连续, 均分, 套鼓可复用 | `♪♪♪` | `N N N` |

---

## 6. 推荐起始练习模板

这些不是基础节奏型，而是由基础节奏型组成的练习队列。

| ID | 名称 | 难度 | 模式建议 | 包含节奏型 | 标签 |
|---|---|---:|---|---|---|
| `template-sixteenth-basic-reading` | 十六分基础读谱 | 1 | `shuffle` | `sixteenth-1000`, `sixteenth-1100`, `sixteenth-1010`, `sixteenth-1111` | 十六分, 基础, 热身, 读谱 |
| `template-sixteenth-offbeat-focus` | 弱位反应训练 | 4 | `shuffle` | `sixteenth-0100`, `sixteenth-0001`, `sixteenth-0101`, `sixteenth-0110`, `sixteenth-0111` | 十六分, 弱位, 反应, 进阶 |
| `template-sixteenth-syncopation` | 切分组合 | 3 | `ordered` | `sixteenth-1001`, `sixteenth-0101`, `sixteenth-1101`, `sixteenth-1011` | 十六分, 切分, 缺位, 读谱 |
| `template-triplet-basic` | 三连音基础 | 1 | `shuffle` | `triplet-100`, `triplet-110`, `triplet-111` | 三连音, 基础, 均分 |
| `template-triplet-offbeat` | 三连音弱位 | 3 | `shuffle` | `triplet-010`, `triplet-001`, `triplet-101`, `triplet-011` | 三连音, 弱位, 反应 |
| `template-silence-and-entry` | 休止与进入 | 4 | `ordered` | `sixteenth-0000`, `sixteenth-0100`, `sixteenth-0010`, `sixteenth-0001`, `triplet-000`, `triplet-010` | 休止, 进入, timing, 进阶 |

---

## 7. UI 渲染规范

### 7.1 节奏型卡片

每张卡片展示：

```text
┌────────────────────┐
│ 节奏名称       2/4 │
│                    │
│      VexFlow       │
│      音符预览       │
│                    │
│   ●   ●   ○   ○    │
└────────────────────┘
```

状态：

| 状态 | UI |
|---|---|
| Default | 深色卡片、灰蓝描边、白色音符 |
| Selected | 黄色描边、暗黄色背景、黄色音符 |
| Disabled | 半透明、虚线描边 |
| Playback Current | 红色播放线、当前拍点黄色圆点 |

### 7.2 卡片渲染与谱面渲染的区别

| 场景 | 渲染策略 |
|---|---|
| 节奏选择卡片 | 紧凑预览，保留圆点辅助，允许省略部分视觉休止 |
| 跟练五线谱 | 精确渲染，每个 slot 的 note/rest 都必须准确 |
| 播放引擎 | 只看 `steps` 和 `hitSlots` |
| MIDI 评分 | 只看 `playback.hitSlots` 与 beat grid |

---

## 8. 开发建议

1. 第一版先内置这 24 个基础节奏型。
2. 不要把卡片画成图片。
3. 使用 VexFlow 渲染卡片音符和跟练谱面。
4. `cardFallbackGlyph` 只用于极小尺寸或渲染失败时的降级显示。
5. 随机练习、顺序练习、无尽模式都基于 `patternIds` 组合。
6. 后续扩展套鼓时，不改 RhythmPattern，只新增 drum voice mapping。

---

## 9. 后续套鼓扩展预留

后续可以新增：

```ts
type DrumVoiceMapping = {{
  patternId: string
  voice: 'snare' | 'kick' | 'hihat' | 'tom'
  midiNote?: number
  staffPosition?: string
}}
```

这样同一个节奏型可以映射到：

- 军鼓
- Hi-hat
- Kick
- 套鼓 Groove
- MIDI ground truth
