
**Document Version:** v0.1\
**Status:** Frozen Draft\
**Product:** RhythmOS Practice Timer\
**Type:** Web App / PWA\
**Position:** RhythmOS 第一阶段 MVP\
**Goal:** 建立鼓手练习记录闭环

------------------------------------------------------------------------

# 1. 产品定位

## 1.1 产品背景

RhythmOS 的最终目标是成为一个面向鼓手的练习操作系统：

    RhythmOS
    │
    ├── Practice Timer       当前版本
    │
    ├── Rhythm Editor        未来
    │
    ├── Trainer              未来
    │
    ├── Library              未来
    │
    └── Analytics            未来

Practice Timer 是 RhythmOS 的第一个独立模块。

它不尝试解决：

-   节奏编辑
-   乐谱管理
-   自动评分
-   MIDI 分析

只解决一个核心问题：

> 帮助鼓手记录每一次有效练习。

------------------------------------------------------------------------

# 2. 产品目标

## 2.1 核心目标

建立最短练习闭环：

    开始练习
        ↓
    记录时间
        ↓
    结束练习
        ↓
    保存记录
        ↓
    查看统计

## 2.2 用户价值

用户可以回答：

-   今天练了吗？
-   练了多久？
-   最近练习频率如何？
-   哪类内容投入最多时间？

------------------------------------------------------------------------

# 3. MVP 功能范围

## 3.1 功能列表

  功能           状态
  -------------- ------
  今日练习首页   必须
  练习计时       必须
  暂停/继续      必须
  结束练习       必须
  保存练习记录   必须
  练习分类       必须
  备注           必须
  历史记录查看   必须
  基础统计       必须
  热力图         必须

## 3.2 明确不包含

v0.1 不实现：

-   账号系统
-   云同步
-   MIDI连接
-   节拍器
-   节奏编辑
-   评分系统
-   AI分析

------------------------------------------------------------------------

# 4. 用户流程

    打开 App

    ↓

    Today 页面

    ↓

    点击开始练习

    ↓

    Timer 页面

    ↓

    练习

    ↓

    结束

    ↓

    Save 页面

    ↓

    保存

    ↓

    统计更新

------------------------------------------------------------------------

# 5. 页面设计

## 5.1 Today 首页

目标：

展示今日状态，并快速开始练习。

包含：

-   今日累计时间
-   今日练习次数
-   当前练习状态
-   今日记录列表

## 5.2 Timer 页面

目标：

提供沉浸式练习计时。

状态机：

    Idle

     ↓ Start

    Running

     ↓ Pause

    Paused

     ↓ Resume

    Running

     ↓ Stop

    Finished

## 5.3 Save 页面

保存一次有效练习。

字段：

-   练习时长
-   分类
-   备注

## 5.4 分类页面

默认分类：

-   基本功
-   手脚协调
-   曲目练习
-   自由练习

## 5.5 统计页面

第一版统计：

-   累计练习时间
-   本周练习时间
-   连续练习天数
-   练习次数
-   分类比例
-   练习热力图

------------------------------------------------------------------------

# 6. 数据模型

## 6.1 PracticeSession

``` typescript
interface PracticeSession {

 id: string;

 startTime: Date;

 endTime: Date;

 duration: number;

 categoryId: string;

 note?: string;

 createdAt: Date;

}
```

## 6.2 Category

``` typescript
interface Category {

 id:string;

 name:string;

 icon:string;

 color:string;

 createdAt:Date;

}
```

------------------------------------------------------------------------

# 7. 数据存储方案

技术选择：

    React

    +

    TypeScript

    +

    IndexedDB

    +

    Dexie.js

    +

    PWA

数据结构：

    Browser

     └── IndexedDB

           ├── sessions

           └── categories

------------------------------------------------------------------------

# 8. 技术架构

    src

    ├── pages
    │
    ├── Today
    ├── Timer
    ├── Save
    ├── Category
    └── Statistics

    components

    ├── TimerCircle
    ├── RecordCard
    └── StatCard

    store

    ├── timerStore
    └── practiceStore

    database

    └── dexie.ts

------------------------------------------------------------------------

# 9. 状态管理

Timer Store：

``` typescript
{
 status:
 "idle"
 |
 "running"
 |
 "paused"

 elapsed:number

 start()

 pause()

 resume()

 stop()
}
```

------------------------------------------------------------------------

# 10. UI设计原则

设计关键词：

    Minimal

    Focus

    Calm

    Musician Tool

设计方向：

-   大留白
-   大数字
-   少按钮
-   弱干扰

------------------------------------------------------------------------

# 11. 后续演进路线

## v0.2 Practice Log

增加：

-   标签
-   搜索
-   编辑记录
-   删除记录

## v0.3 Rhythm Practice

增加：

-   BPM
-   拍号
-   练习目标
-   节奏备注

## v0.5 RhythmOS Core

接入：

-   Figure
-   Groove
-   Song
-   Lesson

## v1.0 RhythmOS

完整系统：

-   练习计划
-   节奏编辑
-   MIDI
-   训练分析
-   个人知识库

------------------------------------------------------------------------

# 12. 冻结决策

已确定：

-   Web App / PWA
-   本地 IndexedDB 存储
-   无账号
-   无云同步
-   单次练习计时为核心
-   分类记录
-   统计反馈
-   为未来 RhythmOS 保留扩展接口

## 当前版本一句话定义

> RhythmOS Practice Timer
> 是一个面向鼓手的本地化练习记录工具，通过简单的计时和记录，帮助用户建立长期练习习惯，为未来
> RhythmOS 节奏训练系统提供基础数据。
