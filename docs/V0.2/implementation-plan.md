# SnareLab Practice Log v0.2 Implementation Plan

> For agentic workers: implement task by task. Each step is intentionally small and includes its own verification. Do not write feature code from this plan until the matching verification approach is ready.

**Goal:** Build the SnareLab Practice Log v0.2 web app from the approved product, technical, and UI specs.

**Architecture:** Use a local-first React PWA with route-level pages, focused UI components, Zustand stores, Dexie repositories, and real-time statistics services. Keep timer facts immutable after save; only category, tags, and note are editable.

**Tech Stack:** React, TypeScript, Vite, React Router, Zustand, Dexie, IndexedDB, vite-plugin-pwa, Vitest, Testing Library, and Playwright or equivalent browser checks.

## Global Constraints

- Foreground product name is SnareLab.
- Bottom navigation is Today, Log, Category, and Statistics.
- Log is calendar-first.
- Search is filter-based, not full-text search.
- Tags are not included in statistics.
- Practice record deletion is hard deletion.
- Deleting a category migrates records to `Uncategorized`.
- Deleting a tag removes that tag from linked records.
- Running timer state is not restored after refresh.
- Finished unsaved session draft is recoverable.
- Do not modify duration, start time, or end time from record edit UI.
- `docs/V0.2/prototypes/snarelab-v0.3-rhythm-practice-prototype.*` is a migrated visual reference only; do not implement BPM, time signature, practice target, rhythm notes, or rhythm statistics in v0.2.
- Keep implementation aligned with `docs/V0.2/SnareLab_Practice_Log_v0.2_Product_Spec.md`, `docs/V0.2/SnareLab_Practice_Log_v0.2_Technical_Design.md`, and `docs/V0.2/SnareLab_Practice_Log_v0.2_UI_Spec.md`.

---

## Files and Responsibilities

- `src/app/`: app providers, router, and shell.
- `src/pages/Today/`: Today dashboard and pending draft prompt.
- `src/pages/Timer/`: focused timer screen.
- `src/pages/Log/`: calendar-first log, selected-day records, and filters.
- `src/pages/Category/`: Category and Tags management center.
- `src/pages/Statistics/`: category-focused statistics.
- `src/components/`: reusable UI components such as navigation, sheets, chips, cards, dialogs, and heatmap.
- `src/database/`: Dexie setup, migrations, and default seed data.
- `src/repositories/`: session, category, and tag data access.
- `src/services/`: statistics, pending draft, and filter services.
- `src/store/`: timer, session, category, and tag stores.
- `src/types/`: shared domain types.
- `tests/`: unit, integration, and UI tests.

---

## Task 1: Project Scaffold and Tooling

**Files:**
- Create or modify: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/app/`, `src/main.tsx`, `src/index.css`, `tests/`

- [ ] **Step 1: Confirm repository baseline.**  
  Instruction: Check that `docs/V0.2/` specs and `docs/V0.2/prototypes/snarelab-v0.3-rhythm-practice-prototype.png` are present before scaffolding.  
  Verification: Run a file listing for `docs/V0.2/`; expected result includes three spec files, `implementation-plan.md`, and the prototype image.

- [ ] **Step 2: Scaffold a React TypeScript Vite app without deleting docs.**  
  Instruction: Add app files at repository root and preserve all existing `docs/`, `.codex/`, and `.agents/` content.  
  Verification: Run the package install command and confirm it completes without removing existing documentation.

- [ ] **Step 3: Add required runtime dependencies.**  
  Instruction: Add React Router, Zustand, Dexie, and vite-plugin-pwa.  
  Verification: Run dependency listing and confirm each package appears exactly once.

- [ ] **Step 4: Add required test dependencies.**  
  Instruction: Add Vitest, Testing Library, jsdom, and a browser test runner if chosen.  
  Verification: Run the test command in empty-test mode; expected result is a clean test runner startup, not a missing-script error.

- [ ] **Step 5: Add standard scripts.**  
  Instruction: Define scripts for local dev, build, unit tests, UI tests, and lint or typecheck.  
  Verification: Run each script once; expected result is success or a meaningful empty-suite message.

---

## Task 2: App Shell, Routes, and Design Tokens

**Files:**
- Create or modify: `src/app/router.tsx`, `src/app/App.tsx`, `src/components/BottomNavigation/`, `src/index.css`

- [ ] **Step 1: Create five routes.**  
  Instruction: Add routes for Today, Timer, Log, Category, and Statistics.  
  Verification: Open each route in the browser; expected result is a page title matching the route and no blank screen.

- [ ] **Step 2: Add four-tab bottom navigation.**  
  Instruction: Add Today, Log, Category, and Statistics tabs with active state.  
  Verification: Use a UI test to visit each tab; expected result is correct route navigation and active tab styling.

- [ ] **Step 3: Add global design tokens.**  
  Instruction: Add color, spacing, radius, typography, and focus styles from the UI spec.  
  Verification: Inspect rendered pages; expected result is white surfaces, blue-purple active states, readable text contrast, and visible focus ring.

- [ ] **Step 4: Add accessibility labels for icon-only controls.**  
  Instruction: Every icon-only button must have a human-readable label.  
  Verification: Run an accessibility check or query icon buttons by label in tests; expected result is no unlabeled control.

---

## Task 3: Database, Types, and Default Data

**Files:**
- Create or modify: `src/types/`, `src/database/dexie.ts`, `src/database/migrations.ts`, `src/database/seedDefaults.ts`, `src/repositories/`

- [ ] **Step 1: Define domain types.**  
  Instruction: Add PracticeSession, Category, Tag, PendingSessionDraft, and LogFilter domain shapes.  
  Verification: Run typecheck; expected result is no unresolved type references.

- [ ] **Step 2: Create Dexie schema.**  
  Instruction: Add sessions, categories, and tags stores with indexes required by the technical design.  
  Verification: Run a database initialization test; expected result is all three stores available.

- [ ] **Step 3: Seed default categories.**  
  Instruction: Seed Fundamentals, Coordination, Song Practice, Free Practice, and Uncategorized.  
  Verification: Run seed twice in a test; expected result is five unique categories and no duplicates.

- [ ] **Step 4: Seed preset tags.**  
  Instruction: Seed the approved preset practice tags.  
  Verification: Run seed twice in a test; expected result is one row per tag name and no duplicates.

- [ ] **Step 5: Validate `Uncategorized` rules.**  
  Instruction: Mark `Uncategorized` as a system category that cannot be deleted.  
  Verification: Attempt deletion in a repository test; expected result is a rejected operation and category still present.

---

## Task 4: Session Repository and Record Integrity

**Files:**
- Create or modify: `src/repositories/sessionRepository.*`, `tests/sessionRepository.*`

- [ ] **Step 1: Add session creation.**  
  Instruction: Save a session with immutable timer fields, required category, optional tags, and optional note.  
  Verification: Repository test saves a record and reads it back with matching fields.

- [ ] **Step 2: Add metadata-only update.**  
  Instruction: Allow updates only to category, tags, and note.  
  Verification: Repository test attempts to change duration and timestamps; expected result is unchanged timer facts.

- [ ] **Step 3: Add hard delete.**  
  Instruction: Delete a session permanently by id.  
  Verification: Repository test deletes a session; expected result is that lookup by id returns no record.

- [ ] **Step 4: Add date and selected-day queries.**  
  Instruction: Query sessions by practice date using start time as the date basis.  
  Verification: Test records across multiple days; expected result is only matching-day records returned.

- [ ] **Step 5: Add filter queries.**  
  Instruction: Support filters for category, tags, date range, and duration range.  
  Verification: Combination-filter test returns only records matching every selected filter.

---

## Task 5: Category and Tag Repositories

**Files:**
- Create or modify: `src/repositories/categoryRepository.*`, `src/repositories/tagRepository.*`, related tests

- [ ] **Step 1: Add category create and edit.**  
  Instruction: Support changing category name, icon, and color.  
  Verification: Repository test edits a category and reads back updated values.

- [ ] **Step 2: Add category deletion migration.**  
  Instruction: When deleting a non-system category, move linked sessions to `Uncategorized`.  
  Verification: Test deletes a category with linked sessions; expected result is category removed and sessions reassigned.

- [ ] **Step 3: Add tag create and edit.**  
  Instruction: Support changing tag name and optional color.  
  Verification: Repository test edits a tag and reads back updated values.

- [ ] **Step 4: Add tag deletion cleanup.**  
  Instruction: When deleting a tag, remove its id from every linked session.  
  Verification: Test deletes a tag linked to multiple sessions; expected result is sessions remain and tag id is absent.

---

## Task 6: Timer, Save Sheet, and Pending Draft

**Files:**
- Create or modify: `src/store/timerStore.*`, `src/pages/Timer/`, `src/components/SaveSessionSheet/`, `src/services/pendingSessionDraftService.*`

- [ ] **Step 1: Implement timer states.**  
  Instruction: Support idle, running, paused, finished, and reset behavior.  
  Verification: Store test walks through start, pause, resume, stop, and reset; expected result is correct status after each action.

- [ ] **Step 2: Connect Timer page controls.**  
  Instruction: Wire start, pause, resume, end, and reset controls to the timer store.  
  Verification: UI test clicks controls; expected result is visible timer status changing correctly.

- [ ] **Step 3: Add Save Sheet fields.**  
  Instruction: Include read-only duration, required category, optional tags, and optional note.  
  Verification: UI test confirms save action is disabled until category is selected.

- [ ] **Step 4: Add pending draft save.**  
  Instruction: Store a finished unsaved session draft when the user leaves without saving.  
  Verification: Service test creates a draft and reads it back after simulated reload.

- [ ] **Step 5: Add pending draft recovery.**  
  Instruction: Show Continue Saving and Discard actions on Today when a draft exists.  
  Verification: UI test confirms Continue opens Save Sheet and Discard clears the draft.

---

## Task 7: Today Page

**Files:**
- Create or modify: `src/pages/Today/`, `src/store/sessionStore.*`, shared cards and records components

- [ ] **Step 1: Show today's summary.**  
  Instruction: Display today's total duration and session count from repository data.  
  Verification: Integration test seeds today's sessions; expected result is matching total and count.

- [ ] **Step 2: Show today's records.**  
  Instruction: Render today's records with category, time, duration, tags, and note preview.  
  Verification: UI test confirms seeded records appear and older records do not.

- [ ] **Step 3: Add start timer action.**  
  Instruction: Connect the primary Today action to Timer route.  
  Verification: UI test clicks Start Timer; expected result is navigation to Timer page.

- [ ] **Step 4: Add empty state.**  
  Instruction: Show a direct, useful message when there are no records today.  
  Verification: UI test with empty database confirms empty state and Start Timer action are visible.

---

## Task 8: Log Page, Heatmap, Filter Sheet, and Record Sheet

**Files:**
- Create or modify: `src/pages/Log/`, `src/components/CalendarHeatMap/`, `src/components/FilterSheet/`, `src/components/RecordBottomSheet/`

- [ ] **Step 1: Build reusable CalendarHeatMap.**  
  Instruction: Support navigation mode for Log and summary mode for Statistics.  
  Verification: Component test renders both modes; expected result is selectable days only in navigation mode.

- [ ] **Step 2: Show Log month view.**  
  Instruction: Display current month, practice intensity, and selected date.  
  Verification: UI test seeds sessions across dates; expected result is intensity shown on matching days.

- [ ] **Step 3: Show selected-day records.**  
  Instruction: Clicking a day updates the record list for that day.  
  Verification: UI test selects two different days; expected result is record list changes.

- [ ] **Step 4: Add Filter Sheet.**  
  Instruction: Add category, tag, date range, and duration range filters.  
  Verification: UI test applies each filter alone and then together; expected result is only matching records visible.

- [ ] **Step 5: Add Record Bottom Sheet view mode.**  
  Instruction: Clicking a record opens details with duration, start time, end time, category, tags, and note.  
  Verification: UI test opens a seeded record; expected result is every field visible.

- [ ] **Step 6: Add Record Bottom Sheet edit mode.**  
  Instruction: Allow editing category, tags, and note only.  
  Verification: UI test confirms duration and timestamps are visible but not editable.

- [ ] **Step 7: Add record delete confirmation.**  
  Instruction: Put permanent delete action in danger area with confirmation.  
  Verification: UI test cancels first and record remains; confirms second and record disappears.

---

## Task 9: Category and Tags Page

**Files:**
- Create or modify: `src/pages/Category/`, category and tag management components

- [ ] **Step 1: Add segmented control.**  
  Instruction: Switch between Category and Tags sections on one page.  
  Verification: UI test toggles both segments; expected result is only matching list visible.

- [ ] **Step 2: Add category list and form.**  
  Instruction: Show category cards and support create/edit flows.  
  Verification: UI test creates and edits a category; expected result is updated list item.

- [ ] **Step 3: Add category delete confirmation.**  
  Instruction: Explain that linked records move to `Uncategorized`.  
  Verification: UI test deletes a category with records; expected result is record category changed to `Uncategorized`.

- [ ] **Step 4: Add tag list and form.**  
  Instruction: Show preset and custom tags and support create/edit flows.  
  Verification: UI test creates and edits a tag; expected result is updated tag list.

- [ ] **Step 5: Add tag delete confirmation.**  
  Instruction: Explain that linked records keep existing but lose the tag.  
  Verification: UI test deletes a linked tag; expected result is record still visible and tag removed.

---

## Task 10: Statistics Page

**Files:**
- Create or modify: `src/pages/Statistics/`, `src/services/statisticsService.*`, stat cards and chart components

- [ ] **Step 1: Add core stat calculations.**  
  Instruction: Calculate total time, period time, streak, and session count from sessions.  
  Verification: Service test with known fixture data returns expected values.

- [ ] **Step 2: Add category distribution.**  
  Instruction: Aggregate duration by category only.  
  Verification: Service test with tagged sessions confirms tags do not affect category distribution.

- [ ] **Step 3: Add heatmap summary mode.**  
  Instruction: Reuse CalendarHeatMap in non-primary-navigation mode.  
  Verification: Component test confirms summary mode does not open record management flow.

- [ ] **Step 4: Verify tag exclusion.**  
  Instruction: Ensure no tag statistics, tag trend, or tag distribution appears on Statistics.  
  Verification: UI test queries Statistics page; expected result is no tag-statistics module.

---

## Task 11: PWA, Offline, Accessibility, and Final Regression

**Files:**
- Create or modify: `vite.config.ts`, PWA assets, app shell, accessibility tests

- [ ] **Step 1: Configure PWA shell caching.**  
  Instruction: Cache app shell, CSS, JavaScript, fonts, and icons.  
  Verification: Build the app and inspect generated service worker assets.

- [ ] **Step 2: Verify offline core flows.**  
  Instruction: In browser tests, load app, simulate offline, then save, edit, filter, and delete local records.  
  Verification: Expected result is all local-first flows work without network.

- [ ] **Step 3: Run accessibility checks.**  
  Instruction: Check focus order, sheet focus management, icon labels, contrast, and reduced motion.  
  Verification: Accessibility test reports no critical violations on Today, Timer, Log, Category, and Statistics.

- [ ] **Step 4: Run complete unit and integration suite.**  
  Instruction: Run all repository, service, store, and component tests.  
  Verification: Expected result is all tests pass with no skipped required coverage.

- [ ] **Step 5: Run complete browser regression suite.**  
  Instruction: Cover practice save, pending draft recovery, Log filtering, record edit, record delete, category delete, tag delete, and Statistics.  
  Verification: Expected result is every user journey passes in a clean browser context.

- [ ] **Step 6: Compare implementation against V0.2 specs.**  
  Instruction: Review product, technical, and UI specs line by line against the app.  
  Verification: Create a checklist of covered requirements and confirm no V0.2 frozen decision is violated.

---

## Final Acceptance Checklist

- [ ] Today shows correct daily summary, records, empty state, and pending draft prompt.
- [ ] Timer supports idle, running, paused, finished, and reset.
- [ ] Save Sheet requires category and supports optional tags and note.
- [ ] Log opens as calendar-first and supports selected-day records.
- [ ] Filters work by category, tags, date range, and duration range.
- [ ] Record details use Bottom Sheet.
- [ ] Record edits cannot modify duration or timestamps.
- [ ] Record deletion is permanent and confirmed.
- [ ] Category deletion migrates sessions to `Uncategorized`.
- [ ] Tag deletion removes tag references without deleting records.
- [ ] Statistics remain category-focused and exclude tags.
- [ ] CalendarHeatMap is reused by Log and Statistics.
- [ ] Finished unsaved draft is recoverable; running timer is not restored.
- [ ] PWA works offline for local-first flows.
- [ ] All automated tests and browser checks pass.
