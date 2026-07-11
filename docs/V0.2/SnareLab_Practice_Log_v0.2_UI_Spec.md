**Document Version:** v0.2
**Status:** Draft for Review
**Product:** SnareLab Practice Log
**Type:** UI Specification
**Platform:** Mobile-first Web App / PWA

---

# 1. UI Direction

V0.2 continues the v0.1 visual direction:

```text
Minimal
Focused
Calm
Professional drummer practice tool
```

The foreground brand is **SnareLab**. RhythmOS remains the long-term system vision and should not dominate the interface.

The UI should feel like a tool used repeatedly during practice: quiet, readable, fast, and low-friction.

---

# 2. Navigation

Bottom navigation uses four tabs:

```text
Today / Log / Category / Statistics
```

Recommended icons:

| Tab | Icon |
| --- | --- |
| Today | Home |
| Log | CalendarDays |
| Category | Folder or Tags |
| Statistics | BarChart3 |

Rules:

- Active tab uses primary color.
- Inactive tab uses secondary text color.
- Touch target is at least 44px.
- Labels remain visible; do not use icon-only navigation.

---

# 3. Design Tokens

## 3.1 Color

Base colors:

| Token | Value | Usage |
| --- | --- | --- |
| `--color-bg` | `#F7F8FA` | App background |
| `--color-surface` | `#FFFFFF` | Cards, sheets, navigation |
| `--color-text` | `#171717` | Primary text |
| `--color-text-secondary` | `#8E8E93` | Secondary text |
| `--color-text-tertiary` | `#B8B8BE` | Disabled or muted text |
| `--color-border` | `#ECEEF2` | Card borders, dividers |
| `--color-primary` | `#5B63F6` | Primary actions, active states |
| `--color-primary-hover` | `#4E56E8` | Pressed or hover |
| `--color-primary-soft` | `#EEF0FF` | Selected soft state |
| `--color-danger` | `#EF4444` | Delete actions |
| `--color-warning` | `#F59E0B` | Unsaved or caution |
| `--color-success` | `#22C55E` | Saved or success |

Category colors:

| Category | Background | Foreground |
| --- | --- | --- |
| Fundamentals | `#DDEBFF` | `#4C7FE8` |
| Coordination | `#E8E4FF` | `#6B5BFF` |
| Song Practice | `#FFE5D6` | `#F26F45` |
| Free Practice | `#FFF1C8` | `#D69A00` |
| Uncategorized | `#EEF0F3` | `#7B8492` |

Rules:

- Primary blue-purple is used sparingly.
- Danger red is reserved for destructive actions.
- Tags may use low-saturation colors but should not overpower category colors.

## 3.2 Typography

Font family:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Text",
  "PingFang SC",
  "Inter",
  "Helvetica Neue",
  Arial,
  sans-serif;
```

Numeric displays:

```css
font-variant-numeric: tabular-nums;
```

Type scale:

| Name | Size | Weight | Usage |
| --- | ---: | ---: | --- |
| Display Timer | 56-64px | 500-700 | Timer page |
| Hero Number | 44-52px | 700 | Today summary |
| Page Title | 28-32px | 700 | Main page title |
| Section Title | 16-18px | 700 | Section headers |
| Body | 14-16px | 400-500 | Main content |
| Caption | 12-13px | 400-500 | Metadata |
| Button | 15-16px | 600 | Buttons |

## 3.3 Spacing

| Token | Value |
| --- | ---: |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |

Layout:

- Mobile design baseline: 390px width.
- Page horizontal padding: 20px.
- Bottom navigation reserve: 96-112px.

## 3.4 Radius and Shadow

| Token | Value | Usage |
| --- | ---: | --- |
| `--radius-sm` | 10px | Chips, inputs |
| `--radius-md` | 16px | Small cards |
| `--radius-lg` | 22px | Main cards |
| `--radius-xl` | 28px | Bottom sheets |
| `--radius-full` | 999px | Pills, circular controls |

Default card shadow:

```css
box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
```

Sheet shadow:

```css
box-shadow: 0 -16px 40px rgba(15, 23, 42, 0.10);
```

---

# 4. Page Specifications

## 4.1 Today

Purpose:

- Show today's practice state.
- Start practice quickly.
- Surface pending unsaved session recovery.

Content:

- Header: `SnareLab`
- Date
- Today's total time
- Today's session count
- Practice hero card
- Start timer button
- Today's records
- Bottom navigation

V0.2 changes:

- Search icon should become a filter/log shortcut only if needed.
- If a pending unsaved session draft exists, show a compact recovery banner.

Recovery banner:

- Text: "You have an unsaved practice session."
- Actions: Continue Saving, Discard
- Continue opens Save Sheet.
- Discard requires confirmation if duration is meaningful.

## 4.2 Timer

Purpose:

- Focus on timing only.

Content:

- Back button
- Title
- Optional more button
- Circular timer
- Status text
- End, pause/resume, reset controls

Rules:

- Do not show category, tags, notes, or statistics.
- End opens Save Sheet.
- Running timer state is not restored after refresh.

## 4.3 Save Sheet

Purpose:

- Convert finished time into a saved record.

Content:

- Duration display
- Category picker
- Tag picker
- Note input
- Save button
- Discard action

Category picker:

- Single select.
- Required.
- Includes `Uncategorized` as fallback.

Tag picker:

- Multi-select.
- Shows preset and custom tags.
- Provides "Add tag" action.

Note:

- Optional.
- Single multiline input.

Primary action:

- Save Record

Rules:

- Save button is disabled until category is selected.
- Duration is read-only.
- Discard requires confirmation.

## 4.4 Log

Purpose:

- Calendar-first historical practice review.

Default layout:

- Page title: `Log`
- Month switcher
- Filter button
- CalendarHeatMap in navigation mode
- Selected day summary
- Selected day record list

Calendar rules:

- Practice days use intensity color.
- Empty days use neutral cells.
- Tapping a day selects it and shows records.
- Current day is visually marked.

Filter:

- Opens Filter Sheet.
- Filterable fields: category, tags, date range, duration range.
- No full-text keyword input in v0.2.

Record list:

- Grouped by selected day.
- Each row shows category, time, duration, tags, and note preview.
- Tapping row opens Record Bottom Sheet.

## 4.5 Record Bottom Sheet

Purpose:

- View, edit, and delete a saved record.

View mode:

- Duration
- Start time
- End time
- Category
- Tags
- Note
- Edit action
- Delete action

Edit mode:

- Category picker
- Tag picker
- Note input
- Save Changes button
- Cancel action

Read-only:

- Duration
- Start time
- End time

Delete:

- Danger action at bottom.
- Opens confirmation dialog.
- Confirmation copy should state that deletion is permanent.

## 4.6 Category and Tags

Purpose:

- Manage classification and descriptive metadata.

Page title:

```text
Category & Tags
```

Structure:

- Segmented control: Category / Tags
- Content list changes based on segment.

Category tab:

- Category cards
- Add category button
- Edit category action
- Delete category action

Category card shows:

- Icon
- Name
- Total duration
- Session count
- Chevron or edit affordance

Delete category confirmation:

- Copy must state that linked records will move to `Uncategorized`.

Tags tab:

- Tag chips or rows
- Add tag button
- Edit tag action
- Delete tag action

Tag row shows:

- Name
- Optional color
- Linked session count

Delete tag confirmation:

- Copy must state that the tag will be removed from related records.

## 4.7 Statistics

Purpose:

- Show progress and category-level practice distribution.

Content:

- Period segmented control
- Total practice time
- Period practice time
- Practice streak
- Session count
- Category distribution
- CalendarHeatMap in summary mode

Rules:

- Tags are not shown.
- Heatmap may allow date summary, but Log remains the main record-management entry.

---

# 5. Component Specifications

## 5.1 CalendarHeatMap

Modes:

- `navigation`: used by Log.
- `summary`: used by Statistics.

Navigation mode:

- Month-focused.
- Date cells are clickable.
- Selected day has a visible ring or filled state.

Summary mode:

- Trend-focused.
- Date interaction is optional and secondary.

Intensity:

- 0: neutral
- 1: very light primary
- 2: light primary
- 3: medium primary
- 4: strong primary

## 5.2 TagChip

States:

- Default
- Selected
- Disabled

Rules:

- Tags are smaller and quieter than category chips.
- Multi-select uses selected background or check icon.

## 5.3 FilterSheet

Content:

- Category single or multi-select, depending on implementation simplicity
- Tag multi-select
- Date range
- Duration range

Actions:

- Apply
- Reset
- Close

Rules:

- Active filter count should appear on the Filter button.
- Reset clears all filters.

## 5.4 ConfirmDialog

Used for:

- Delete record
- Delete category
- Delete tag
- Discard unsaved session

Rules:

- Destructive confirm button uses danger color.
- Cancel is the safer visual default.
- Copy must name the consequence.

---

# 6. Interaction Rules

## 6.1 Editing Records

Allowed:

- Category
- Tags
- Note

Not allowed:

- Duration
- Start time
- End time

## 6.2 Deleting Records

- Always requires confirmation.
- Permanent deletion copy is required.
- After deletion, close the sheet and refresh visible data.

## 6.3 Deleting Categories

- System categories cannot be deleted.
- Deleting a category requires confirmation.
- Confirmation explains migration to `Uncategorized`.

## 6.4 Deleting Tags

- Deleting a tag requires confirmation.
- Confirmation explains removal from related records.

## 6.5 Pending Draft Recovery

- Show recovery prompt on Today.
- Continue opens Save Sheet.
- Discard clears draft.

---

# 7. Motion

Principles:

- Light
- Fast
- Cause-and-effect

Recommended durations:

| Interaction | Duration |
| --- | ---: |
| Page transition | 150-220ms |
| Bottom sheet entrance | 220-280ms |
| Button pressed | 100-150ms |
| Calendar selection | 120-180ms |

Rules:

- Support `prefers-reduced-motion`.
- Avoid decorative or excessive animation.

---

# 8. Accessibility

Minimum requirements:

- Body text contrast >= 4.5:1.
- Large numeric text contrast >= 3:1.
- All buttons keyboard focusable.
- Icon-only buttons have `aria-label`.
- Dialogs and sheets manage focus.
- Destructive actions are announced clearly.

Focus ring:

```css
outline: 2px solid rgba(91, 99, 246, 0.45);
outline-offset: 2px;
```

ARIA examples:

| Element | Label |
| --- | --- |
| Start timer | `aria-label="Start practice timer"` |
| Pause timer | `aria-label="Pause practice timer"` |
| Resume timer | `aria-label="Resume practice timer"` |
| End timer | `aria-label="End practice and save"` |
| Filter Log | `aria-label="Filter practice log"` |
| Delete record | `aria-label="Delete practice record"` |
| Add tag | `aria-label="Add practice tag"` |

---

# 9. Empty States

## Today

No records:

- "No practice recorded today."
- Primary action: Start Timer

## Log

No records in month:

- "No practice records this month."
- Secondary hint: Start from Today.

Filtered no results:

- "No records match these filters."
- Action: Reset filters

## Category

No custom categories:

- Show default categories and add action.

## Tags

No custom tags:

- Show preset tags and add action.

---

# 10. Frozen UI Decisions

- Foreground brand is SnareLab.
- Bottom navigation has four tabs.
- Log is calendar-first.
- CalendarHeatMap is reused by Log and Statistics.
- Record details and editing use Bottom Sheet.
- Filtering uses Bottom Sheet.
- Category and Tags share one management page.
- Tags are not displayed in Statistics.
- Destructive actions require confirmation.
- V0.1 visual language remains the baseline.
