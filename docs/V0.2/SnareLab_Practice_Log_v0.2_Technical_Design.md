**Document Version:** v0.2
**Status:** Draft for Review
**Product:** SnareLab Practice Log
**Platform:** Web App / PWA
**Frontend:** React + TypeScript
**Last Update:** 2026-07

---

# 1. Purpose

This document defines the technical design for SnareLab Practice Log v0.2.

It extends the v0.1 local-first practice timer into a manageable practice log while keeping the architecture simple, offline-capable, and ready for future RhythmOS expansion.

---

# 2. Technical Goals

## 2.1 Goals

- Preserve the v0.1 stack and architecture.
- Add Log, category management, and tag management.
- Support record metadata editing without modifying timer facts.
- Support hard delete for practice records.
- Support category deletion with migration to `Uncategorized`.
- Support tag deletion with cleanup from linked records.
- Recover finished but unsaved session drafts.
- Keep statistics real-time and non-redundant.

## 2.2 Non-Goals

V0.2 does not implement:

- Backend services
- Authentication
- Cloud sync
- Full-text search
- Tag statistics
- Soft delete
- Running timer recovery after refresh
- BPM or time signature data
- MIDI, audio, or video features

---

# 3. Stack

The v0.1 stack remains frozen:

```text
React 19
TypeScript strict mode
Vite
React Router
Zustand
Dexie
IndexedDB
vite-plugin-pwa
```

No additional global state framework or search engine is introduced in v0.2.

---

# 4. Routes

```text
/             Today
/timer        Timer
/log          Log
/category     Category and Tags
/statistics   Statistics
```

Record details, filters, save flow, category forms, and tag forms use sheets or dialogs instead of route-level pages unless implementation constraints require otherwise.

---

# 5. Project Structure

Recommended structure:

```text
src
├── app
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
├── pages
│   ├── Today
│   ├── Timer
│   ├── Log
│   ├── Category
│   └── Statistics
├── components
│   ├── AppHeader
│   ├── BottomNavigation
│   ├── CalendarHeatMap
│   ├── CategoryChip
│   ├── ConfirmDialog
│   ├── FilterSheet
│   ├── RecordBottomSheet
│   ├── RecordCard
│   ├── SaveSessionSheet
│   ├── StatCard
│   ├── TagChip
│   └── TimerDisplay
├── database
│   ├── dexie.ts
│   ├── seedDefaults.ts
│   └── migrations.ts
├── repositories
│   ├── categoryRepository.ts
│   ├── sessionRepository.ts
│   └── tagRepository.ts
├── services
│   ├── statisticsService.ts
│   ├── pendingSessionDraftService.ts
│   └── logFilterService.ts
├── store
│   ├── timerStore.ts
│   ├── sessionStore.ts
│   ├── categoryStore.ts
│   └── tagStore.ts
├── hooks
├── types
├── utils
└── assets
```

Rules:

- Pages do not access Dexie directly.
- Database writes go through repositories.
- Aggregations live in services or repository methods, not UI components.
- Components remain presentational where practical.

---

# 6. Data Model

## 6.1 PracticeSession

```typescript
interface PracticeSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  categoryId: string;
  tagIds: string[];
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Rules:

- `duration`, `startTime`, and `endTime` are locked after save.
- `categoryId`, `tagIds`, and `note` are editable.
- `categoryId` must always point to an existing category.
- `tagIds` may be empty.

## 6.2 Category

```typescript
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Rules:

- `uncategorized` is a required system category.
- System categories cannot be deleted.
- When a non-system category is deleted, linked sessions migrate to `uncategorized`.

## 6.3 Tag

```typescript
interface Tag {
  id: string;
  name: string;
  color?: string;
  isPreset: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Rules:

- Tags can be preset or user-created.
- Tags can be edited and deleted.
- Deleting a tag removes its id from all sessions.
- Tags are not part of v0.2 statistics.

## 6.4 PendingSessionDraft

```typescript
interface PendingSessionDraft {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  createdAt: Date;
}
```

Rules:

- Created when a finished session is not saved.
- Restored into Save Sheet on user request.
- Discarding removes the draft.
- Running timer state is not persisted as a draft.

---

# 7. IndexedDB Schema

Dexie version 2:

```typescript
db.version(2).stores({
  sessions: "id, createdAt, updatedAt, categoryId, startTime, endTime, duration, *tagIds",
  categories: "id, name, isSystem, updatedAt",
  tags: "id, name, isPreset, updatedAt"
});
```

Notes:

- `*tagIds` allows multi-entry indexing for tag-based filtering.
- Duration range filtering can use the `duration` index where useful.
- Date filtering can use `startTime`, `endTime`, or `createdAt`; product views should consistently use `startTime` as the practice date.

---

# 8. Migration

## 8.1 From v0.1 to v0.2

Existing sessions:

- Add `tagIds: []`.
- Add `updatedAt`, defaulting to `createdAt` or current migration time.

Existing categories:

- Add `isSystem: false`.
- Add `updatedAt`, defaulting to `createdAt` or current migration time.

Default category:

- Ensure `uncategorized` exists.

Default tags:

- Seed preset tags if the `tags` table is empty.

## 8.2 Migration Safety

Migration must be idempotent:

- Running seed logic twice must not duplicate `uncategorized`.
- Running seed logic twice must not duplicate preset tags by name.

---

# 9. Repository Responsibilities

## 9.1 SessionRepository

Required methods:

```typescript
saveSession(input)
updateSessionMetadata(id, { categoryId, tagIds, note })
deleteSession(id)
findById(id)
findToday()
findByDate(date)
findByDateRange(start, end)
filterSessions(filters)
```

Rules:

- `updateSessionMetadata` must not accept duration or timestamps.
- `deleteSession` hard deletes the record.
- `filterSessions` supports category, tags, date range, and duration range.

## 9.2 CategoryRepository

Required methods:

```typescript
findAll()
createCategory(input)
updateCategory(id, input)
deleteCategory(id)
ensureDefaultCategories()
```

Deletion rules:

- Reject deletion for system categories.
- Use a transaction.
- Update linked sessions to `uncategorized`.
- Delete the category after migration.

## 9.3 TagRepository

Required methods:

```typescript
findAll()
createTag(input)
updateTag(id, input)
deleteTag(id)
ensurePresetTags()
```

Deletion rules:

- Use a transaction.
- Remove the tag id from all sessions that include it.
- Delete the tag.

---

# 10. Services

## 10.1 StatisticsService

Calculates:

- Total duration
- Period duration
- Practice streak
- Session count
- Category distribution
- Heatmap data

Rules:

- Statistics are real-time calculations.
- No redundant statistics table.
- Tags are ignored for v0.2 statistics.

## 10.2 PendingSessionDraftService

Responsibilities:

- Save a finished unsaved session draft.
- Read current draft.
- Clear draft.
- Convert draft into Save Sheet input.

Storage:

- IndexedDB is preferred for consistency.
- localStorage is acceptable because only one pending draft is needed, but date serialization must be handled carefully.

## 10.3 LogFilterService

Responsibilities:

- Normalize filter input.
- Apply category, tag, date range, and duration range filters.
- Keep full-text search out of v0.2.

---

# 11. State Management

## 11.1 TimerStore

Responsible for:

- Timer status
- Elapsed time
- Start, pause, resume, stop, reset

Does not handle:

- Session persistence
- Category selection
- Tag selection

## 11.2 SessionStore

Responsible for:

- Today's sessions
- Log results
- Selected record
- Record bottom sheet state
- Save session state

## 11.3 CategoryStore

Responsible for:

- Category list
- Category create/edit/delete loading states

## 11.4 TagStore

Responsible for:

- Tag list
- Tag create/edit/delete loading states

## 11.5 Filter State

Filter state can be local to the Log page unless it becomes shared across pages.

---

# 12. Component Design

## 12.1 CalendarHeatMap

Purpose:

- Reused by Log and Statistics.

Props:

```typescript
type CalendarHeatMapMode = "navigation" | "summary";

interface CalendarHeatMapProps {
  mode: CalendarHeatMapMode;
  month?: Date;
  range?: { start: Date; end: Date };
  data: Array<{
    date: string;
    duration: number;
    sessionCount: number;
  }>;
  onSelectDate?: (date: string) => void;
}
```

Rules:

- `navigation` mode supports selecting a date.
- `summary` mode prioritizes trend display.
- Empty days use neutral cells.

## 12.2 RecordBottomSheet

Modes:

- View
- Edit
- Delete confirmation

Editable fields:

- Category
- Tags
- Note

Read-only fields:

- Duration
- Start time
- End time

## 12.3 FilterSheet

Filters:

- Category
- Tags
- Date range
- Duration range

Actions:

- Apply
- Reset
- Close

---

# 13. Error Handling

Database failures:

- Show toast or inline error.
- Allow retry when applicable.

Delete failures:

- Do not dismiss the sheet until the operation succeeds.
- Show clear failure message.

Migration failures:

- Fail loudly in development.
- In production, show a recovery message and avoid destructive fallback.

Pending draft parse failures:

- Discard invalid draft only after user confirmation when possible.

---

# 14. PWA and Offline

V0.2 remains fully local:

- App shell cached.
- CSS and JS cached.
- Fonts and icons cached.
- Data stored in IndexedDB.

Offline behavior:

- Practice, save, edit, delete, filter, and statistics work offline.
- No sync queue is needed.

---

# 15. Performance Targets

| Area | Target |
| --- | --- |
| Today load | <500ms |
| Page transition | <100ms |
| Timer display | 60fps |
| Session save/edit/delete | <50ms typical local operation |
| Log filter apply | <150ms for normal local dataset |
| Heatmap render | <100ms for visible range |

---

# 16. Testing Strategy

## 16.1 Unit Tests

Cover:

- Timer status transitions
- Session metadata update cannot modify duration or timestamps
- Category deletion migrates sessions
- Tag deletion cleans session tagIds
- Filter matching
- Statistics calculations
- Pending draft save/read/clear

## 16.2 Integration Tests

Cover:

- Save session with category and tags
- Recover pending draft and save it
- Delete record and verify statistics update
- Delete category and verify records move to `uncategorized`
- Delete tag and verify linked records remain

## 16.3 UI Tests

Cover:

- Log calendar date selection
- Filter Sheet apply/reset
- Record Bottom Sheet view/edit/delete
- Category and Tags segmented control
- Confirm dialogs for destructive actions

## 16.4 Accessibility Checks

Cover:

- Keyboard focus
- Screen-reader labels for icon buttons
- Dialog focus trap
- Color contrast
- Reduced motion

---

# 17. Frozen Decisions

- Keep React, TypeScript, Vite, Zustand, Dexie, and PWA.
- Use `sessions`, `categories`, and `tags` as primary data tables.
- Add `tagIds` to sessions.
- Keep statistics real-time.
- Do not add full-text search.
- Do not add tag statistics.
- Do not restore running timer state after refresh.
- Restore finished unsaved session draft.
- Use hard delete for records.
- Use transaction-based cleanup for category and tag deletion.
- Reuse `CalendarHeatMap` for Log and Statistics.
