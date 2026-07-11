
> Version: v0.1
>
> Status: Frozen
>
> Product: RhythmOS Practice Timer
>
> Platform: Web App (PWA)
>
> Frontend: React + TypeScript
>
> Last Update: 2026-07

---

# 1. 文档目的

本文档定义 RhythmOS Practice Timer v0.1 的技术实现方案。

主要目标：

- 明确项目技术架构
- 明确模块划分
- 明确数据模型
- 明确数据库设计
- 明确页面状态管理
- 为后续 RhythmOS 演进保留扩展能力

本文档不讨论 UI 设计，UI 规范由 **UI Design Specification** 独立维护。

---

# 2. 技术目标

## 2.1 MVP 原则

Practice Timer 不是完整 RhythmOS。

它只是整个系统的第一个可交付模块。

因此：

> **优先简单，而不是完整。**

技术原则：

- 无服务器
- 无账号
- 本地数据库
- 离线可用
- 可渐进扩展

---

## 2.2 非目标

本版本不实现：

- 云同步
- 登录系统
- MIDI
- 节拍器
- 节奏编辑
- AI分析
- 多人数据

---

# 3. 技术栈

## Framework

```
React 19
```

原因：

- 社区成熟
- 组件化
- 易于未来扩展 RhythmOS

---

## Language

```
TypeScript
```

原因：

整个项目采用严格类型。

```
strict = true
```

---

## Build Tool

```
Vite
```

优点：

- 快
- 配置简单
- HMR优秀

---

## Router

```
React Router
```

页面：

```
/

/timer

/save

/category

/statistics
```

---

## State Management

```
Zustand
```

不采用 Redux。

原因：

Practice Timer 状态非常简单。

---

## Database

```
IndexedDB

+

Dexie
```

原因：

- 浏览器原生数据库
- 支持事务
- 支持索引
- 离线

---

## PWA

使用：

```
vite-plugin-pwa
```

支持：

- 安装桌面
- 安装手机
- 离线缓存

---

# 4. 项目目录

```
src

├── app

├── pages
│
├── Today
├── Timer
├── Save
├── Category
└── Statistics

├── components
│
├── Button
├── TimerDisplay
├── StatCard
├── RecordCard
├── CategoryChip
├── BottomNavigation

├── database
│
├── dexie.ts
├── sessionRepository.ts
└── categoryRepository.ts

├── store
│
├── timerStore.ts
├── sessionStore.ts
└── categoryStore.ts

├── hooks

├── utils

├── types

└── assets
```

---

# 5. 页面架构

```
App

├── Today

├── Timer

├── Save

├── Category

└── Statistics
```

页面职责：

Today

负责：

- 今日数据
- 开始练习

---

Timer

负责：

- 计时
- 暂停
- 恢复
- 结束

---

Save

负责：

- 保存练习
- 分类
- 备注

---

Category

负责：

- 分类管理
- 分类统计

---

Statistics

负责：

- 累计统计
- 热力图
- 分类分析

---

# 6. 数据流

```
User

↓

Timer Store

↓

Practice Session

↓

IndexedDB

↓

Statistics

↓

UI
```

所有统计均来自数据库实时计算。

禁止维护冗余统计数据。

---

# 7. 状态管理

## Timer Store

```
Idle

↓

Running

↓

Paused

↓

Running

↓

Finished

↓

Idle
```

对应：

```typescript
type TimerStatus =
    | "idle"
    | "running"
    | "paused"
    | "finished";
```

---

Store：

```typescript
interface TimerStore {

status:TimerStatus;

elapsed:number;

startTime?:Date;

start();

pause();

resume();

stop();

reset();

}
```

---

# 8. 数据模型

## PracticeSession

```typescript
interface PracticeSession {

id:string;

startTime:Date;

endTime:Date;

duration:number;

categoryId:string;

note?:string;

createdAt:Date;

}
```

---

## Category

```typescript
interface Category{

id:string;

name:string;

icon:string;

color:string;

createdAt:Date;

}
```

---

# 9. 数据库设计

Dexie：

```
Database

↓

practiceTimer
```

Schema：

```typescript
db.version(1).stores({

sessions:

"id,createdAt,categoryId,startTime",

categories:

"id,name"

});
```

---

Sessions

```
id

createdAt

categoryId

startTime

endTime

duration

note
```

---

Categories

```
id

name

icon

color
```

---

# 10. Repository

Repository 负责数据库访问。

禁止页面直接访问 Dexie。

```
Page

↓

Store

↓

Repository

↓

Database
```

例如：

```typescript
SessionRepository

save()

delete()

findAll()

findToday()

findByCategory()

findByDate()

statistics()
```

---

# 11. Store

Practice Store：

负责：

- 今日记录
- 当前记录
- 保存记录

Category Store：

负责：

- 分类
- 分类统计

Timer Store：

负责：

- Timer 生命周期

---

# 12. 页面生命周期

Today

```
Load

↓

读取今日记录

↓

统计今日时间

↓

显示首页
```

---

Timer

```
点击开始

↓

创建 Timer

↓

Running

↓

Pause

↓

Resume

↓

Stop

↓

Save Page
```

---

Save

```
填写分类

↓

填写备注

↓

保存数据库

↓

返回 Today
```

---

Statistics

```
读取数据库

↓

计算统计

↓

刷新UI
```

---

# 13. 统计计算

统计全部实时计算。

例如：

累计时间：

```
SUM(duration)
```

本周：

```
date >= monday
```

连续练习：

```
连续日期
```

分类：

```
GROUP BY category
```

热力图：

```
date

↓

duration

↓

color level
```

---

# 14. Component Architecture

```
AppHeader

↓

StatCard

↓

TimerDisplay

↓

PrimaryButton

↓

CategoryChip

↓

RecordCard

↓

HeatMap
```

所有组件保持：

```
Pure Component
```

禁止业务逻辑。

---

# 15. Hook

```
useTimer()

useToday()

useStatistics()

useCategory()
```

所有数据库访问封装到 Hook。

---

# 16. 错误处理

数据库失败：

```
Toast

↓

重试
```

Timer：

```
浏览器刷新

↓

自动停止

↓

提示恢复
```

备注：

v0.1 不支持恢复 Timer。

后续版本实现。

---

# 17. PWA

缓存：

```
App Shell

Fonts

Icons

CSS

JS
```

数据库：

```
IndexedDB
```

离线：

完全可运行。

---

# 18. 性能目标

首页：

```
<500ms
```

页面切换：

```
<100ms
```

Timer：

```
60fps
```

数据库：

```
<20ms
```

---

# 19. 可扩展设计

未来：

```
PracticeSession

↓

Lesson

↓

Figure

↓

Groove

↓

Song
```

保持：

```
Session

永远是所有练习数据入口。
```

后续新增：

```
tempo

timeSignature

target

musicXML

midi

trainerId
```

不会破坏已有结构。

---

# 20. 开发计划

## Sprint 1

项目初始化

完成：

- React
- Vite
- Dexie
- Zustand
- Router

---

## Sprint 2

Today

Timer

Save

完成：

完整练习闭环。

---

## Sprint 3

Category

Statistics

Heatmap

完成：

数据统计。

---

## Sprint 4

PWA

安装

图标

离线

发布

---

# 21. 代码规范

命名：

```
PascalCase

Component
```

```
camelCase

Function
```

```
kebab-case

Route
```

文件：

```
一个组件

一个文件
```

禁止：

```
utils.ts

common.ts

helper.ts
```

应按职责拆分。

---

# 22. 技术冻结（Freeze）

## 已冻结

✅ React + TypeScript

✅ Vite

✅ Zustand

✅ Dexie

✅ IndexedDB

✅ PWA

✅ Repository Pattern

✅ Hook + Store

✅ Session 为唯一核心数据模型

✅ 统计实时计算

✅ 无后端

✅ 无账号

---

# 23. 下一阶段

Technical Design 完成后，即进入开发阶段：

```
UI Design Specification
        │
        ▼
Technical Design Specification
        │
        ▼
Sprint 1
        │
        ▼
Sprint 2
        │
        ▼
Sprint 3
        │
        ▼
Release v0.1
```

---

# Appendix A：未来 RhythmOS 技术演进

```
Practice Timer

        │

        ▼

Practice Log

        │

        ▼

Rhythm Editor

        │

        ▼

Trainer

        │

        ▼

Library

        │

        ▼

RhythmOS Core
```

整个系统将始终围绕 **PracticeSession** 作为统一的数据入口进行扩展，从而保证数据模型稳定、技术架构可持续演进。