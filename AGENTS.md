# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains product documentation and UI prototypes for SnareLab.

- `docs/V0.0/`: early UI direction and prototype iterations.
- `docs/V0.1/`: frozen v0.1 product and technical specifications.
- `docs/V0.2/`: SnareLab Practice Log product, technical, and UI specs.
- `docs/V0.3/prototypes/`: v0.3 prototype HTML and exported PNG assets.
- `.codex/` and `.agents/`: project-local Codex skills, hooks, and agent support files.

There is no application source tree yet. When implementation begins, prefer `src/` for app code, `src/components/` for reusable UI, `src/pages/` for route-level screens, `src/repositories/` for data access, and `src/types/` for shared TypeScript types.

## Build, Test, and Development Commands

No package manager or build scripts are currently defined. Do not assume `npm test` or `npm run build` exists until `package.json` is added.

For static prototype work, open the HTML directly, for example:

```bash
open docs/V0.3/prototypes/snarelab-v0.3-rhythm-practice-prototype.html
```

Once the app is scaffolded, document the actual commands here, such as:

```bash
npm run dev
npm run build
npm test
```

## Coding Style & Naming Conventions

Use concise, descriptive filenames. Versioned docs should follow the existing pattern:

```text
docs/V0.2/SnareLab_Practice_Log_v0.2_Product_Spec.md
```

For future TypeScript code, use `PascalCase` for components, `camelCase` for functions and variables, and `kebab-case` for route paths. Keep UI copy plain and action-oriented. Avoid broad utility files such as `utils.ts`; split helpers by responsibility.

## Testing Guidelines

No automated test framework is configured yet. For documentation and prototype changes, verify links, image paths, and rendered layout manually. For future app code, add unit tests for repositories, stores, timer state transitions, filtering, and statistics calculations. Name tests close to the unit under test, for example `timerStore.test.ts`.

## Commit & Pull Request Guidelines

This repository has no commit history yet, so no local convention is established. Use clear, imperative commit messages such as:

```text
Add v0.3 rhythm practice prototype
Update v0.2 technical design
```

Pull requests should include a short summary, affected docs or screens, screenshots for prototype/UI changes, and any verification performed. Link related issues or decisions when available.

## Agent-Specific Instructions

Respect existing project docs as the source of truth. Do not overwrite user-created files or generated prototypes without explicit direction. When changing UI prototypes, keep both the editable HTML and exported image in sync.

## 补充协议1
1. 写任何代码之前都必须完整阅读V0.2文件夹里面的文件及原型图
2. 写前端代码前必须识别V0.3中的原型图
3. 每完成一个重大功能或者里程碑，必须更新memory-bank/arch.md

## 补充协议2
1. 每次任务完成之后都要回复：车老板！已完成！