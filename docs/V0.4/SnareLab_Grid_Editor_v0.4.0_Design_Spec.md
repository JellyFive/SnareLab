# SnareLab Grid Editor v0.4.0 设计规范

**版本：** v0.4.0  
**状态：** 待书面确认  
**产品：** SnareLab / RhythmOS Grid Editor  
**平台：** 本地优先 Web App / PWA  
**更新时间：** 2026-07-13

## 1. 产品定位

V0.4.0 在现有 SnareLab Practice Log v0.3 基础上新增第四个主导航页面“编辑”。本版本第一次引入可编辑、可保存、可真实播放的鼓组节奏 Grid，但不把编辑器播放自动计入练习日志，也不改变 Today、记录、统计和计时流程。

V0.4.0 的核心闭环是：

```text
新建或打开节奏文档
  -> 在 Grid 中添加或删除音符
  -> 自动保存到 IndexedDB
  -> 使用本地鼓组采样真实播放
  -> 调整 BPM、循环、轨道 Mute/Solo 和主音量
```

## 2. V0.4.0 范围

### 2.1 必须实现

- 在底部主导航增加第四个“编辑”Tab，并新增 `/editor` 路由。
- 支持多个节奏文档的新建、打开、重命名和删除。
- 使用 Dexie/IndexedDB 自动保存文档并恢复上次打开的文档。
- 使用 Canvas 绘制与编辑鼓组 Grid。
- 固定 4/4 拍、每拍四个 16 分音符 Step。
- 支持 1 至 16 小节。
- 固定 8 条鼓轨：Hi-Hat、Snare、Kick、Tom 1、Tom 2、Tom 3、Ride、Crash。
- 点击或键盘操作切换“无音符／普通音符”。
- 支持音符编辑、小节增删和清空操作的 Undo/Redo。
- 内置一套本地鼓组采样，使用 Web Audio API 真实播放并支持离线使用。
- 支持播放、暂停、停止、40–240 BPM、全曲循环、播放头和主音量。
- 支持 8 条轨道的 Mute/Solo，并真实影响播放调度。
- 手机提供可横向滚动的精简 Grid；平板横屏和桌面提供宽屏工作台。

### 2.2 明确不实现

- Figure Library 与 Figure 拖入 Grid。
- 五线谱或 VexFlow 渲染。
- Song、Groove、Lesson Library。
- Count-in、独立节拍器、节拍器重音和播放头自动跟随滚动。
- 多套鼓组音色或音色切换。
- 可变拍号、可变细分、32 分音符和三连音编辑。
- 连音编辑和 Hi-Hat 开闭奏法编辑。
- 轨道新增、删除、重命名或排序。
- 鼠标或触摸拖动连续绘制音符。
- 双指缩放、Grid 缩放和自由拖拽。
- 将编辑器播放自动转换为练习记录或统计数据。
- 账户、云同步、协作、MIDI、录音、AI 或服务端能力。

后续能力应在数据模型和模块边界中预留，但不得以不可用按钮出现在 V0.4.0 页面中。

## 3. 信息架构与路由

主导航调整为：

```text
今日 / 记录 / 统计 / 编辑
```

路由：

```text
/             今日
/timer        计时
/records      记录
/statistics   统计
/editor       Grid Editor
```

现有 `/log` 兼容重定向保持不变。编辑器使用独立的宽屏页面容器，不受现有移动内容区 `720px` 最大宽度限制。进入其他主导航、切换文档或页面进入后台时必须停止播放。

## 4. 页面与响应式设计

### 4.1 桌面和平板横屏

页面由四个已启用区域组成：

```text
EditorToolbar
  ├── 文档切换
  ├── 新建 / 重命名 / 删除
  ├── Undo / Redo
  └── 保存状态

EditorWorkspace
  ├── 小节管理
  ├── TrackControlPanel
  └── RhythmGridCanvas

TransportControls
  ├── 播放 / 暂停 / 停止
  ├── BPM
  ├── 循环
  └── 主音量
```

不显示尚未实现的 Library、五线谱、Count-in 和节拍器区域。

### 4.2 手机

- 顶部保留紧凑文档栏、Undo/Redo 和保存状态。
- 轨道名称与 Mute/Solo 固定在左侧。
- 时间轴和 Canvas 位于原生横向滚动容器内。
- Transport 位于 Grid 下方并保持易于触控。
- 不实现双指缩放；横向浏览使用原生滚动。
- 所有图标按钮至少提供 44px 点击区域和中文可访问名称。

### 4.3 首次进入与恢复

- 没有文档时创建并打开“未命名节奏”。
- 有文档时恢复上次打开的有效文档。
- 上次文档已删除或损坏时打开最近更新的有效文档。
- 没有有效文档时重新创建“未命名节奏”。

## 5. 核心数据模型

### 5.1 RhythmDocument

```typescript
interface RhythmDocument {
  id: string;
  name: string;
  bpm: number;
  ppq: 480;
  timeSignature: {
    numerator: 4;
    denominator: 4;
  };
  subdivision: "sixteenth";
  measureCount: number;
  tracks: RhythmTrack[];
  notes: RhythmNote[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 RhythmTrack

```typescript
type RhythmTrackId =
  | "hi-hat"
  | "snare"
  | "kick"
  | "tom-1"
  | "tom-2"
  | "tom-3"
  | "ride"
  | "crash";

interface RhythmTrack {
  id: RhythmTrackId;
  mute: boolean;
  solo: boolean;
}
```

### 5.3 RhythmNote

```typescript
interface RhythmNote {
  id: string;
  trackId: RhythmTrackId;
  tick: number;
  durationTicks: number;
  velocity: number;
  articulation: "normal" | "closed" | "open";
  tie?: "start" | "continue" | "stop";
  tuplet?: {
    actualNotes: number;
    normalNotes: number;
  };
}
```

### 5.4 时间规则

- 每个四分音符为 480 ticks。
- 4/4 小节为 1920 ticks。
- 16 分音符 Step 间隔为 120 ticks。
- 当前音符位置为 `measureIndex * 1920 + stepIndex * 120`。
- 首版新音符使用默认 `durationTicks`、`velocity` 和 `articulation: "normal"`。
- `tick`、`durationTicks`、`tuplet`、`tie` 和 `articulation` 为未来 32 分音符、三连音、连音及开闭镲提供扩展基础。

### 5.5 IndexedDB

在现有 `SnareLabDatabase` 上增加新 schema 版本和两张表：

- `rhythmDocuments`：索引 `id`、`name`、`updatedAt`。
- `editorPreferences`：以稳定 key 保存上次打开文档等编辑器偏好。

不得删除、重命名或重写现有 `sessions`、`categories`、`tags` 和 `pendingDrafts` 表。数据库升级测试必须证明 V0.3 数据保持不变。

文档整体作为聚合对象原子保存。Undo/Redo 历史不进入 IndexedDB。

## 6. Grid 编辑规则

### 6.1 Canvas 绘制

- Canvas 按 `devicePixelRatio` 缩放绘制，CSS 尺寸与内部像素尺寸分离。
- 小节线、拍线和 16 分 Step 使用不同视觉权重。
- 音符颜色沿用 SnareLab 靛蓝体系，并允许轨道使用克制的区分色。
- 播放头是独立绘制层或独立重绘状态，不写入文档数据。
- Canvas 只负责 Grid；文档栏、轨道标签、Mute/Solo 和 Transport 使用可访问 DOM 控件。

### 6.2 点击与键盘

- 点击或轻触通过 Canvas 坐标换算 `trackId + tick`。
- 同一轨道和 Tick 已有音符时删除；没有音符时添加。
- Canvas 可获取键盘焦点。
- 方向键移动当前格子，`Space` 或 `Enter` 切换音符。
- 状态播报区说明当前轨道、位置以及添加或删除结果。
- 首版不支持拖动连续绘制，避免手机滚动误触。

### 6.3 小节管理

- 最少 1 小节，最多 16 小节。
- 新增小节追加到末尾。
- 删除当前选中小节；含音符时需要确认。
- 删除后，后续小节的音符 Tick 整体前移一个小节长度。
- 支持清空当前小节和清空全部，均需确认。

### 6.4 Undo/Redo

- 覆盖音符切换、小节新增、小节删除、清空当前小节和清空全部。
- 最多保留 100 个历史状态。
- 执行新编辑后清空 Redo 分支。
- 历史只属于当前打开文档和当前页面会话，不跨刷新或文档切换保存。

## 7. 文档管理与自动保存

- 支持新建、打开、重命名和删除多个节奏文档。
- 文档内容变化约 300ms 后自动保存。
- 切换文档前立即刷新尚未执行的保存任务。
- 保存状态明确显示“保存中”“已保存”或“保存失败”。
- 保存失败不丢弃当前内存数据，并提供重试动作。
- 删除文档需要确认。
- 删除后打开最近更新的其他文档；删除最后一个文档后立即创建新的“未命名节奏”。
- 文档切换前停止音频播放并清空当前文档的 Undo/Redo 历史。

## 8. 真实音频播放

### 8.1 采样与音频图

- 项目内置一套具有明确使用权的本地鼓组采样。
- 8 条轨道通过稳定 `sampleManifest` 映射到对应音频文件。
- 首次用户触发播放时创建或恢复 `AudioContext`。
- 使用 `decodeAudioData` 解码并缓存 `AudioBuffer`。
- 所有采样节点连接到共享 `GainNode`，再连接到输出。
- 本地采样加入 PWA 预缓存，安装后可离线播放。
- 仓库必须包含采样来源与授权说明。

### 8.2 调度

- 使用 `AudioContext.currentTime` 作为唯一播放时钟。
- 调度循环约每 25ms 运行一次。
- 每次提前调度未来约 100ms 的音符。
- 音符时间通过 Tick、PPQ 和 BPM 换算。
- React 状态和普通定时器不得作为音符精确发声的时钟。
- `requestAnimationFrame` 仅用于根据音频时钟更新播放头。

### 8.3 Transport

- BPM 范围为 40–240，默认 120。
- 播放从当前停止位置开始；停止后位置回到第一个 Step。
- 暂停保存当前 Tick；继续从该 Tick 恢复。
- 循环开启时，播放到文档末尾后回到开头。
- 循环关闭时，播放到文档末尾后停止。
- BPM 修改影响尚未进入约 100ms 调度窗口的音符。
- 主音量通过共享 `GainNode` 调整。

### 8.4 Mute/Solo

- 存在任意 Solo 轨道时，只调度 Solo 且未 Mute 的轨道。
- 没有 Solo 轨道时，调度所有未 Mute 轨道。
- Mute 和 Solo 变化影响尚未调度的音符。
- 首版保存每个文档的 Mute/Solo 状态。

### 8.5 停止与错误

- 切换文档、离开编辑器、进入后台或卸载页面时停止调度并停止已创建的播放节点。
- 采样尚未完成加载时显示加载状态，防止重复启动。
- 任一必需采样加载失败时禁用播放并说明失败音色；Grid 编辑和保存仍然可用。
- 浏览器不支持必要 Web Audio 能力时显示明确的不支持状态，不影响文档读取和编辑。

## 9. 模块边界

- `EditorPage`：路由协调、文档加载、响应式组合和离页停止。
- `EditorToolbar`：文档管理、Undo/Redo 和保存状态。
- `TrackControlPanel`：轨道名称与 Mute/Solo。
- `RhythmGridCanvas`：绘制、命中、键盘游标、音符切换和播放头。
- `TransportControls`：播放状态、BPM、循环与主音量输入。
- `editorStore`：当前文档、编辑历史、保存状态和播放 UI 状态。
- `rhythmDocumentRepository`：节奏文档与编辑器偏好的唯一 Dexie 访问边界。
- `rhythmTimingService`：Tick、Step、BPM 和音频时间的纯函数换算。
- `RhythmAudioEngine`：采样缓存、调度器、播放节点、Gain 和资源清理。
- `sampleManifest`：轨道到采样资产的稳定映射与授权元数据。

页面和 React 组件不得直接访问 Dexie 表；音频调度不得放入 React 组件渲染或 Effect 循环中。

## 10. 与 Practice Log 的数据边界

- 节奏文档不属于 `PracticeSession`。
- 播放 Grid 不创建、修改或删除练习记录。
- 编辑器数据不参与 Today、记录或统计聚合。
- V0.4.0 不在练习记录中保存节奏文档引用。
- 后续版本可通过明确的“使用此节奏开始练习”流程连接两个领域，但不得在当前版本中隐式耦合。

## 11. 测试与验收

### 11.1 单元测试

- Tick、Step、小节与 BPM 时间换算。
- 1–16 小节边界和删除小节后的 Tick 位移。
- 音符添加、删除、清空和去重规则。
- Undo/Redo 的 100 步上限与分支清理。
- Mute/Solo 轨道选择规则。
- 音频调度顺序、暂停继续、停止复位、循环边界和 BPM 变化。

### 11.2 数据与集成测试

- Dexie 升级保留全部 V0.3 表和数据。
- 文档新建、读取、重命名、更新和删除。
- 自动保存、立即刷新、失败重试和上次文档恢复。
- 删除最后一个文档后重新创建默认文档。
- 保存与恢复 Mute/Solo、BPM、小节和音符。

### 11.3 组件与无障碍测试

- Canvas 坐标命中和高 DPI 尺寸换算。
- 键盘移动、音符切换和状态播报。
- 文档删除、小节删除与清空确认。
- BPM 输入边界、Transport 禁用态和采样错误态。
- 每个图标按钮具有中文可访问名称和可见焦点。

### 11.4 浏览器与 PWA 验收

- 390px 手机、平板横屏和桌面宽度均可编辑和播放。
- 手机轨道列保持可见，Grid 可横向滚动且不误触连续写入。
- 新建文档、编辑、自动保存、刷新恢复和删除流程通过。
- 播放、暂停、停止、BPM、循环、主音量和 Mute/Solo 流程通过。
- 离线打开、编辑、保存、刷新和播放通过。
- 切换 Tab、切换文档和页面进入后台后音频停止。
- 现有 Today、计时、记录、统计、设置、图片附件和 PWA 测试全部通过。

## 12. 验收标准

V0.4.0 完成时必须满足：

- 用户可从第四个“编辑”Tab 进入 Grid Editor。
- 用户可管理多个节奏文档，刷新后数据不丢失。
- 用户可在 8 条轨道、1–16 小节的 16 分 Grid 中添加和删除音符。
- 用户可撤销和重做主要 Grid 编辑操作。
- 用户可使用内置采样准确播放所编辑的节奏。
- 播放、暂停、停止、BPM、循环、播放头、音量和 Mute/Solo 行为正确。
- 手机、平板横屏和桌面布局符合各自的信息密度和操作方式。
- PWA 离线状态下可编辑、保存和播放。
- 编辑器不会污染练习日志或统计。
- 数据库升级不会破坏任何 V0.3 数据。

## 13. 实施与文档规则

- 不重建项目；在现有 React、TypeScript、Vite、Zustand、Dexie、Vitest、Testing Library、Playwright 和 PWA 基础上升级。
- 每次只执行实施计划中的一个重大任务。
- 每个重大任务完成后，先运行相关自动验证并交由车老板手动验收。
- 收到明确验收通过后，立即更新 `memory-bank/process.md` 和 `memory-bank/arch.md`。
- 发现本规范、原型或实施计划冲突时，停止实施并一次提出一个明确问题。
- 每个任务完成后回复：`车老板！已完成！`
