# SnareLab 技术栈建议 V1.0

## 变更记录

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-06-23 | V1.0 | 基于 `design/SnareLab-design-document.md` 生成 V1.0 推荐技术栈。 |

> 文档目的：为 SnareLab V1.0 MVP 选择简单、健壮、适合本地优先浏览器应用的技术栈。  
> 结论优先：V1.0 不引入后端，不使用 Next.js，不引入复杂全栈框架；先用 React SPA 把练习闭环做稳。

## 1. 推荐结论

SnareLab V1.0 推荐采用：

| 层级 | 推荐技术 | 选择理由 |
|---|---|---|
| 语言 | TypeScript | 节奏型、练习、session、IndexedDB schema 都需要强类型约束。 |
| 前端框架 | React | 适合组件化构建首页、节奏选择、跟练、练习库和日志页。 |
| 构建工具 | Vite | 简单、快、适合纯前端 SPA，不需要服务端渲染。 |
| 路由 | React Router | 覆盖 `/home`、`/rhythm`、`/trainer`、`/library`、`/log`、`/settings` 足够稳定。 |
| 状态管理 | Zustand | API 小、样板少，适合分离 rhythm、queue、trainer、log、settings 状态。 |
| 本地数据库 | Dexie + IndexedDB | 本地优先、离线可用，适合 sessions、goals、notes、exercises。 |
| 谱面渲染 | ScoreRenderer 抽象 + VexFlow | MVP 可先用 HTML/SVG 实现，接口预留 VexFlow 精确渲染。 |
| 音频 | Web Audio API | 浏览器内稳定调度 click、demo drum、accent、count-in。 |
| 样式 | CSS Modules + 全局 CSS variables | 比 Tailwind 更贴合现有 prototype token，简单且可控。 |
| 图标 | lucide-react | 轻量、线性图标，适合驾驶舱工具 UI。 |
| 测试 | Vitest + Testing Library + Playwright | 单元、组件、端到端路径分别覆盖。 |
| 代码质量 | ESLint + Prettier | 保持 TypeScript/React 代码一致性。 |
| 包管理器 | pnpm | 安装快、锁文件稳定，适合后续 monorepo 化。 |

## 2. 不推荐在 V1.0 引入

| 技术 / 方向 | V1.0 不采用原因 |
|---|---|
| Next.js | 当前不需要 SSR、RSC、API routes 或服务端部署；会增加心智负担。 |
| 后端服务 | V1.0 明确本地优先，不做账号、云同步、老师端或在线评分。 |
| Redux Toolkit | 功能强但样板更多；Zustand 足够覆盖当前状态规模。 |
| Tailwind 优先方案 | 可用，但现有 UI 原型已形成 token 和组件风格，CSS Modules 更直接。 |
| Electron / Tauri | 桌面封装属于后续阶段，先保证浏览器端体验。 |
| Web MIDI | 保留扩展位，V1.0 不做 MIDI 准确度评分。 |
| Web Worker | 暂不默认引入；只有谱面生成或导入导出出现明显卡顿时再加入。 |

## 3. 前端工程建议

推荐目录：

```text
frontend/
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   ├── pages/
│   ├── components/
│   ├── features/
│   ├── catalog/
│   ├── db/
│   ├── stores/
│   ├── audio/
│   ├── score/
│   ├── services/
│   ├── styles/
│   └── types/
└── prototype/
```

关键约束：

- `frontend/src/catalog/rhythm-pattern-catalog.v1.ts` 是节奏型开发期唯一主源。
- `frontend/src/catalog/rhythm-pattern-catalog.v1.json` 由脚本生成，用于调试、导出和未来外部配置。
- VexFlow 通过 `ScoreRenderer` 抽象接入，不直接写进页面组件。
- Web Audio 通过 `AudioScheduler` 接入，不直接写进 React 组件。
- 高频播放进度使用 refs、外部 scheduler 和节流后的 store 更新，避免每个音符 tick 触发全页面 re-render。
- VexFlow、导入导出、未来 MIDI 等重型能力按需动态加载，降低初始 bundle。

## 4. 运行时模块分工

| 模块 | 技术 | 职责 |
|---|---|---|
| `app` | React Router | 路由、AppShell、Provider、错误边界。 |
| `stores` | Zustand | UI/业务临时状态，如当前选择、播放状态、设置状态。 |
| `db` | Dexie | 持久化 exercises、sessions、goals、notes、settings。 |
| `catalog` | TypeScript module | 内置 rhythm patterns 和 starter templates。 |
| `score` | HTML/SVG + VexFlow | 谱面渲染抽象与实现。 |
| `audio` | Web Audio API | click、demo drum、accent、count-in、lookahead scheduler。 |
| `services` | TypeScript services | CatalogService、ExerciseGenerator、SessionService 等业务流程。 |

## 5. 测试技术栈

| 测试层级 | 推荐工具 | 覆盖内容 |
|---|---|---|
| 单元测试 | Vitest | ExerciseGenerator、CatalogService、SessionService、纯函数。 |
| 组件测试 | Testing Library | PatternCard、PracticeQueue、BpmControl、LogItem 等交互。 |
| E2E 测试 | Playwright | `/home -> /rhythm -> /trainer -> /log` MVP 主路径。 |
| 数据测试 | fake-indexeddb + Vitest | Dexie schema、导入导出、session start/update/end。 |
| 音频测试 | Vitest mock + 少量手动验收 | AudioScheduler 事件生成、BPM 变化、layer 开关。 |

MVP 必测路径：

```text
/home
-> /rhythm 选择 pattern
-> 生成 PracticeExercise
-> /trainer 播放、暂停、调整 BPM、结束
-> session 写入 IndexedDB
-> /log 显示最近记录
```

## 6. 依赖建议

核心依赖：

```json
{
  "dependencies": {
    "@vexflow/vexflow": "latest",
    "dexie": "latest",
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-router-dom": "latest",
    "zustand": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "eslint": "latest",
    "fake-indexeddb": "latest",
    "playwright": "latest",
    "prettier": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

版本策略：

- 初始化工程时锁定实际安装版本，提交 `pnpm-lock.yaml`。
- 不在文档中承诺长期使用 `latest`；`latest` 只表示初始化时选择当前稳定版本。
- 任何升级 React、Vite、Dexie、VexFlow、Playwright 的动作都需要先跑完整测试。

## 7. 简单健壮原则

- 先完成浏览器端本地闭环，再考虑后端、桌面封装或 MIDI。
- 业务数据进入 Dexie，瞬时 UI 状态进入 Zustand，播放时钟留在 AudioScheduler。
- 频繁变化的播放进度不要直接驱动大范围 React 渲染。
- 对 heavy modules 使用动态加载，尤其是 VexFlow 和未来 MIDI。
- 避免 barrel imports，保持导入路径可静态分析，控制 bundle。
- 本地数据 schema 必须版本化，导入导出必须携带版本信息。

