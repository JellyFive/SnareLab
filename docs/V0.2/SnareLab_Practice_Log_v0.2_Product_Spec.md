**Document Version:** v0.2
**Status:** Draft for Review
**Product:** SnareLab Practice Log
**Type:** Web App / PWA
**Position:** RhythmOS first-stage practice data foundation
**Goal:** Upgrade the practice timer into a reliable practice log

---

# 1. Product Positioning

## 1.1 Background

The v0.1 specs defined the first usable practice loop:

```text
Start practice
  -> Track time
  -> End practice
  -> Save session
  -> View basic statistics
```

Version 0.2 keeps the same local-first PWA direction and upgrades the saved record into a manageable practice log. It does not move into advanced rhythm training yet. Instead, it makes practice history easier to review, filter, annotate, edit, and maintain.

RhythmOS remains the long-term system vision. SnareLab is the foreground product name for this phase.

## 1.2 One-Sentence Definition

SnareLab Practice Log is a local-first practice logging tool for drummers that helps users record, review, filter, and maintain their practice history without adding high-friction training features too early.

---

# 2. Product Goals

## 2.1 Core Goals

V0.2 must answer:

- Did I practice today?
- Which days did I practice this month?
- What did I practice on a specific day?
- Which category did I spend time on?
- Which tags describe the techniques or goals in a session?
- Can I correct the meaning of a record without changing the timer facts?

## 2.2 User Value

The user can:

- Start and save a practice session quickly.
- Recover a finished but unsaved session draft.
- Review historical practice through a calendar-first log.
- Filter records by category, tag, date range, and duration range.
- Edit category, tags, and note after saving.
- Delete records intentionally.
- Maintain categories and tags to match their own practice system.

---

# 3. Scope

## 3.1 Required Features

| Feature | Status |
| --- | --- |
| Today dashboard | Required |
| Practice timer | Required |
| Pause and resume | Required |
| Save session | Required |
| Pending unsaved session recovery | Required |
| Calendar-first Log page | Required |
| Record detail bottom sheet | Required |
| Edit category, tags, and note | Required |
| Hard delete practice record | Required |
| Category management | Required |
| Tag management | Required |
| Filter by category | Required |
| Filter by tag | Required |
| Filter by date range | Required |
| Filter by duration range | Required |
| Statistics by category | Required |
| Heatmap/calendar reuse | Required |

## 3.2 Explicit Non-Goals

V0.2 does not include:

- Account system
- Cloud sync
- MIDI connection
- Metronome
- Rhythm editor
- BPM tracking
- Time signature tracking
- Practice plan completion
- AI analysis
- Audio or video upload
- Social sharing
- Full-text search
- Tag-based statistics
- Editing practice duration, start time, or end time
- Soft delete or recycle bin

---

# 4. Information Architecture

## 4.1 Navigation

Bottom navigation has four primary tabs:

```text
Today / Log / Category / Statistics
```

## 4.2 Pages

### Today

Purpose:

- Show today's practice status.
- Provide the fastest path to start practice.
- Show today's saved records.
- Surface pending unsaved session recovery when available.

Contains:

- Today's total time
- Today's session count
- Practice hero card
- Start timer action
- Today's record list
- Pending draft prompt

### Timer

Purpose:

- Provide a focused, low-distraction practice timer.

States:

```text
Idle -> Running -> Paused -> Running -> Finished
```

Rules:

- The timer does not require category selection before practice.
- Category and tags are assigned after practice.
- Running timer state is not restored after refresh.

### Save Sheet

Purpose:

- Save a finished session by assigning meaning to the recorded time.

Fields:

- Duration, read-only
- Category, required
- Tags, optional multi-select
- Note, optional

Rules:

- If the finished session is not saved, store it as a pending draft.
- The user can continue saving or discard the draft later.

### Log

Purpose:

- Review and manage historical practice records.

Default view:

- Calendar/month view first.
- Days with practice show intensity.
- Tapping a day opens that day's records.

Filtering:

- Category
- Tags
- Date range
- Duration range

Rules:

- Filtering is not full-text search.
- Filtered results still preserve date context where possible.

### Record Bottom Sheet

Purpose:

- View, edit, or delete a saved record without leaving the current page.

View mode shows:

- Duration
- Start time
- End time
- Category
- Tags
- Note

Edit mode allows:

- Category
- Tags
- Note

Edit mode does not allow:

- Duration
- Start time
- End time

Delete:

- Hard delete after confirmation.

### Category and Tags

Purpose:

- Manage the user's practice classification system.

Structure:

- A segmented control switches between Category and Tags.

Category management:

- Create category
- Edit category name, icon, and color
- Delete category

Tag management:

- Create tag
- Edit tag name and optional color
- Delete tag

Rules:

- The system category `Uncategorized` always exists.
- `Uncategorized` cannot be deleted.
- Deleting a category migrates its records to `Uncategorized`.
- Deleting a tag removes that tag from related records.

### Statistics

Purpose:

- Show practice progress and category-level distribution.

Contains:

- Total practice time
- Current week or period time
- Practice streak
- Session count
- Category distribution
- Practice heatmap

Rules:

- Tags are not included in statistics in v0.2.
- Statistics are calculated from active sessions in real time.

---

# 5. Core User Flows

## 5.1 Practice and Save

```text
Open app
  -> Today
  -> Start practice
  -> Timer running
  -> End practice
  -> Save Sheet
  -> Select category
  -> Select optional tags
  -> Add optional note
  -> Save
  -> Today and statistics update
```

## 5.2 Recover Unsaved Session

```text
Open app
  -> Pending draft exists
  -> Prompt appears
  -> Continue saving
  -> Save Sheet opens
```

Alternative:

```text
Open app
  -> Pending draft exists
  -> Prompt appears
  -> Discard
  -> Draft is removed
```

## 5.3 Review a Day

```text
Open Log
  -> Month calendar
  -> Tap a practice day
  -> Day record list
  -> Tap record
  -> Record Bottom Sheet
```

## 5.4 Filter Log

```text
Open Log
  -> Open Filter Sheet
  -> Select category/tags/date range/duration range
  -> Apply
  -> Filtered records shown
```

## 5.5 Edit a Record

```text
Open record bottom sheet
  -> Enter edit mode
  -> Change category/tags/note
  -> Save changes
  -> Lists and statistics refresh
```

## 5.6 Delete a Record

```text
Open record bottom sheet
  -> Tap delete
  -> Confirm
  -> Record is permanently removed
  -> Statistics refresh
```

## 5.7 Delete a Category

```text
Open Category and Tags
  -> Select category
  -> Delete
  -> Confirm migration to Uncategorized
  -> Records move to Uncategorized
  -> Category is deleted
```

## 5.8 Delete a Tag

```text
Open Category and Tags
  -> Tags tab
  -> Select tag
  -> Delete
  -> Confirm removal from related records
  -> Tag is removed from sessions
  -> Tag is deleted
```

---

# 6. Data Rules

## 6.1 Practice Record Integrity

A saved timer session represents a factual timing record.

Editable fields:

- Category
- Tags
- Note

Locked fields:

- Start time
- End time
- Duration

## 6.2 Deletion

Practice record deletion is hard deletion.

Rules:

- Deleted records are removed from IndexedDB.
- Deleted records no longer appear in Log, Today, Category, or Statistics.
- There is no recycle bin in v0.2.

## 6.3 Category Fallback

`Uncategorized` is a system category.

Rules:

- It is created by default.
- It cannot be deleted.
- It receives records from deleted categories.

## 6.4 Tags

Tags are descriptive metadata.

Rules:

- A session can have zero or more tags.
- Tags can be preset or user-created.
- Deleting a tag removes it from all linked sessions.
- Tags do not affect statistics in v0.2.

---

# 7. Default Data

## 7.1 Default Categories

- Fundamentals
- Coordination
- Song Practice
- Free Practice
- Uncategorized

## 7.2 Suggested Preset Tags

- Single Stroke
- Double Stroke
- Paradiddle
- Rudiment
- Groove
- Fill
- Timing
- Dynamics
- Speed
- Control
- Independence
- Reading
- Endurance
- Accuracy

---

# 8. Success Criteria

V0.2 is successful when:

- A user can practice, save, and recover an unsaved finished session.
- A user can review practice days from the Log calendar.
- A user can filter records without full-text search.
- A user can edit record category, tags, and note.
- A user can delete a record with confirmation.
- A user can manage categories and tags.
- Deleting categories and tags never leaves broken records.
- Statistics remain simple and category-focused.

---

# 9. Future Roadmap

## v0.3 Rhythm Practice

Possible additions:

- BPM
- Time signature
- Practice target
- Rhythm notes

## v0.5 RhythmOS Core

Possible additions:

- Figure
- Groove
- Song
- Lesson

## v1.0 RhythmOS

Possible additions:

- Practice plans
- Rhythm editor
- MIDI
- Trainer
- Analytics
- Personal rhythm knowledge base

---

# 10. Frozen Decisions

The following decisions are frozen for v0.2:

- Product foreground name is SnareLab.
- V0.2 module name is Practice Log.
- Bottom navigation includes Today, Log, Category, and Statistics.
- Log page is calendar-first.
- Record detail and editing use a bottom sheet.
- Record editing does not modify duration or timestamps.
- Record deletion is hard deletion.
- Category deletion migrates records to `Uncategorized`.
- Tags are managed in Category and Tags.
- Tags are not included in statistics.
- Search is filter-based, not full-text search.
- Running timer state is not restored after refresh.
- Finished unsaved session draft is recoverable.
