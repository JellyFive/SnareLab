# VexFlow 渲染规则建议

## 变更记录

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-06-23 | 项目结构调整 | 纳入标准项目目录；后续文档变更需维护本表。 |

## 1. 卡片渲染

卡片渲染使用 `pattern.render.card`：

- 目标：小尺寸可读。
- 谱表：单线 percussion staff。
- 休止显示：minimal。
- 辅助：底部圆点必须显示。
- 降级：如果 VexFlow 未加载，使用 `cardFallbackGlyph`。

## 2. 跟练页渲染

跟练页使用 `pattern.render.score`：

- 目标：准确读谱。
- 十六分：每个 slot 渲染为 `16` 或 `16r`。
- 三连音：每个 slot 渲染为 `8` 或 `8r`，并包裹为 3:2 tuplet。
- 小节组合：每个 beat 对应一个 RhythmPattern，根据拍号拼接。
- 播放线：由全局 beat grid 驱动，不由视觉位置反推。

## 3. 播放和评分

播放和后续 MIDI 评分不读取视觉符号，而读取：

```ts
pattern.render.playback.hitSlots
pattern.subdivision
pattern.slotLabels
```

这样可以避免“视觉渲染”和“真实击打点”不一致。
