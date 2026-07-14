# Development Process Log

## 2026-07-10 - Task 1: Project Scaffold and Tooling

### Context

Task 1 was executed from `docs/V0.2/implementation-plan.md` after reading the V0.2 product, technical, UI specs, and the migrated prototype assets in `docs/V0.2/prototypes/`.

The v0.3 prototype was treated as visual reference only. BPM, time signature, practice target, rhythm notes, and rhythm statistics were not implemented.

### What Changed

- Added a React + TypeScript + Vite application scaffold at the repository root.
- Added PWA configuration through `vite-plugin-pwa`.
- Added Vitest + Testing Library setup for unit and integration tests.
- Added Playwright setup for future mobile-first UI tests.
- Added global CSS tokens based on the V0.2 UI spec.
- Added a minimal `App` placeholder so the scaffold can render.
- Added `.gitignore` entries for generated artifacts such as `node_modules/`, `dist/`, and test output.
- Preserved all existing `docs/`, `.codex/`, and `.agents/` content.

### Dependency Notes

- Runtime dependencies: React, React DOM, React Router, Zustand, Dexie, and `vite-plugin-pwa`.
- Test and tooling dependencies: TypeScript, Vitest, Testing Library, jsdom, Playwright, React type packages, Node type packages, and `@vitejs/plugin-react`.
- `@vitejs/plugin-react` was pinned to `5.2.0` because the latest 6.x line caused an npm peer dependency conflict through the Babel 8 optional chain while the current dependency tree uses Babel 7 through Workbox.
- npm reported `fsevents` install-script warnings. This is an optional macOS file-watcher dependency and did not block installation, build, or tests.

### Verification Performed

- Confirmed `docs/V0.2/` still contains the three V0.2 specs, `implementation-plan.md`, and the migrated prototype PNG/HTML.
- Ran `npm ls` for all required runtime and test dependencies.
- Ran `npm run typecheck`; TypeScript completed without errors.
- Ran `npm run build`; Vite built successfully and generated PWA service worker assets.
- Ran `npm test`; Vitest started with an empty suite and exited successfully.
- Ran `npm run test:ui`; Playwright started with an empty suite and exited successfully.
- Ran `npm run dev -- --host 127.0.0.1`; Vite served the app at `http://127.0.0.1:5173/`, then the process was stopped.

### Handoff Notes

- The app currently shows only a Task 1 placeholder screen. Route, navigation, and feature work start in Task 2.
- Playwright and dev-server commands may need local port permission in restricted environments.
- Do not start Task 2 until the user explicitly approves moving on after reviewing Task 1.

## 2026-07-10 - Task 2: App Shell, Routes, and Design Tokens

### Context

Task 2 was implemented only after re-reading the complete V0.2 product,
technical, UI, and implementation-plan documents; the migrated V0.3 prototype
HTML and PNG were also reviewed as visual reference. The V0.3-only BPM, time
signature, practice target, and rhythm-statistics ideas remain outside V0.2.

The task stops at an application shell. It establishes navigation and visual
foundations but does not introduce timer behavior, persistence, records,
categories, tags, filters, or statistics calculations.

### What Changed

- Replaced the Task 1 welcome placeholder with a React Router application shell.
- Added direct routes for `/`, `/timer`, `/log`, `/category`, and `/statistics`.
- Added a fallback route that returns unknown paths to Today.
- Added four visible bottom-navigation destinations: Today, Log, Category, and
  Statistics. The Timer remains a focused route without bottom navigation.
- Added an active navigation state using React Router's `aria-current="page"`.
- Added the reusable `src/components/BottomNavigation/` component and its
  public barrel export.
- Refined global CSS tokens and shell styles for the V0.2 light surface,
  blue-purple selection state, 44px minimum navigation target, visible focus
  ring, and reduced-motion behavior.
- Added component-level route/navigation tests and Playwright browser tests.

### Test-First Record

- Added `src/app/App.test.tsx` before implementation.
- Confirmed the initial test run failed because the Task 1 shell had no route
  titles or navigation links.
- Implemented the smallest route and navigation shell needed to satisfy those
  behaviors.
- Re-ran the test file and confirmed all seven tests passed.

### Verification Performed

- Ran `npm test`: one test file and seven tests passed.
- Ran `npm run typecheck`: completed without TypeScript errors.
- Ran `npm run build`: production Vite and PWA build completed successfully.
- Ran `git diff --check`: no whitespace errors were reported.
- The user manually verified Task 2 and confirmed it passed.

### Browser Test Note

- Added `tests/app-shell.e2e.ts` for the five direct routes and four primary
  navigation transitions.
- `npm run test:ui` cannot yet launch because the local Playwright Chromium
  executable is absent. Two `npx playwright install chromium` attempts did not
  complete the browser download in this environment. Re-run that command when
  the local browser download is available, then run `npm run test:ui`.

### Handoff Notes

- Do not begin Task 3 until the user explicitly authorizes it.
- Task 3 should add domain types, Dexie schema, migrations, seed data, and
  repository tests without changing Task 2 route or bottom-navigation contracts.

## 2026-07-10 - Task 3: Database, Types, and Default Data

### Context

Task 3 was implemented after re-reading every V0.2 specification, the
implementation plan, both migrated prototype assets, and the existing
`memory-bank` records. It establishes the local data foundation only; no route,
visual, or user-facing behavior changed.

The V0.3-only BPM, time signature, practice target, and rhythm fields remain
outside the V0.2 domain model.

### What Changed

- Added shared `PracticeSession`, `Category`, `Tag`, `PendingSessionDraft`, and
  `LogFilter` domain types.
- Added `SnareLabDatabase`, a Dexie v2 database with `sessions`, `categories`,
  and `tags` tables and indexes defined by the technical design.
- Added a v1-to-v2 migration that supplies missing `tagIds`, `updatedAt`, and
  `isSystem` fields without overwriting existing values.
- Added five default categories: Fundamentals, Coordination, Song Practice,
  Free Practice, and the required system category `Uncategorized`.
- Added the fourteen approved preset tags.
- Made both seed functions idempotent for repeated execution.
- Added the initial `CategoryRepository.deleteCategory` protection that rejects
  deletion of a system category. The non-system migration transaction remains
  Task 5 work.
- Added `fake-indexeddb` as a development dependency so Vitest can exercise
  real Dexie behavior without a browser.

### Test-First Record

- Added `src/database/database.test.ts` before the Task 3 implementation.
- Confirmed the first run failed because the database module did not exist.
- Implemented the smallest data-layer modules necessary for the specified
  schema, migrations, seed data, and system-category rule.
- Re-ran the dedicated database suite and confirmed all six tests passed.

### Verification Performed

- Ran `npm test`: two test files and thirteen tests passed.
- Ran `npm run typecheck`: completed without TypeScript errors.
- Ran `npm run build`: production Vite and PWA build completed successfully.
- Ran `npm ls fake-indexeddb --depth=0`: confirmed `fake-indexeddb@6.2.5` is
  installed as a direct development dependency.
- Ran `git diff --check`: no whitespace errors were reported.
- Searched the new data modules for V0.3-only rhythm fields; none were found.
- The user manually verified Task 3 and confirmed it passed.

### Handoff Notes

- Do not begin Task 4 until the user explicitly authorizes it.
- Task 4 should implement `SessionRepository` creation, metadata-only updates,
  hard deletion, date queries, and combined filters on the schema established
  here.
- Task 5 must extend `CategoryRepository.deleteCategory` so a non-system
  category migrates linked sessions to `uncategorized` inside one transaction.

## 2026-07-10 - Task 4: Session Repository and Record Integrity

### Context

Task 4 was implemented after re-reading the complete V0.2 product, technical,
and UI specifications, implementation plan, prototype assets, and current
architecture/process notes. It adds local session persistence only; no UI or
route changed.

The repository preserves timer facts after creation. V0.3 BPM, time signature,
practice target, and rhythm fields remain absent.

### What Changed

- Added `SessionRepository` and its save input, metadata-update input, and
  constructor options types.
- Added `saveSession`, which verifies the referenced category exists and stores
  immutable timer facts, optional tags/note, and creation/update timestamps.
- Added `updateSessionMetadata`, which writes only category, tag ids, note, and
  `updatedAt`; unexpected duration or timestamp fields are ignored at runtime.
- Added `deleteSession` as permanent IndexedDB deletion.
- Added `findById`, `findToday`, `findByDate`, and `findByDateRange`.
- Added `filterSessions` for category, tag, date range, and duration range.
  Every enabled filter dimension must match. Multiple selected tags use
  any-match semantics.
- Added `CategoryNotFoundError` for session writes that reference no category.

### Test-First Record

- Added `src/repositories/sessionRepository.test.ts` before implementation.
- Confirmed the initial run failed because `SessionRepository` did not exist.
- Implemented the smallest repository behavior needed for creation, immutable
  timer fields, hard deletion, date queries, and combined filters.
- Re-ran the dedicated suite and confirmed all five tests passed.

### Verification Performed

- Ran `npm test`: three test files and eighteen tests passed.
- Ran `npm run typecheck`: completed without TypeScript errors.
- Ran `npm run build`: production Vite and PWA build completed successfully.
- Ran `git diff --check`: no whitespace errors were reported.
- Searched the new repository and test for V0.3-only rhythm fields; none were
  found.
- The user manually verified Task 4 and confirmed it passed.

### Handoff Notes

- Do not begin Task 5 until the user explicitly authorizes it.
- Task 5 should extend category deletion with a transaction that moves linked
  sessions to `uncategorized`, and add tag cleanup across linked sessions.

## 2026-07-10 - Task 5: Category and Tag Repositories

### What Changed

- Expanded `CategoryRepository` with list, create, edit, and transaction-based
  delete behavior.
- Deleting a non-system category now moves linked sessions to `uncategorized`
  before deleting the category. System categories remain protected.
- Added `TagRepository` with list, create, edit, and transaction-based delete.
- Deleting a tag removes its id from every linked session while retaining those
  sessions.
- Added real IndexedDB tests for category/tag create-edit and deletion cleanup.

### Verification Performed

- Ran `npm test`: four test files and twenty-two tests passed.
- Ran `npm run typecheck` and `npm run build`: both completed successfully.
- The user manually verified Task 5 and confirmed it passed.

### Handoff Notes

- Do not begin Task 6 until the user explicitly authorizes it.

## 2026-07-10 - Task 6: Timer, Save Sheet, and Pending Draft

### What Changed

- Added Zustand timer states for idle, running, paused, finished, and reset.
- Added the Timer route controls and a finished-session Save Sheet.
- Save Sheet requires a category and writes the finished session through
  `SessionRepository` after ensuring default categories exist.
- Added pending-draft save/read/clear behavior, with a storage fallback for
  restricted test environments.
- Added a Today recovery prompt with Continue Saving and Discard actions.

### Verification Performed

- Added timer-state and pending-draft tests before implementation.
- Ran `npm test`: six test files and twenty-four tests passed.
- Ran `npm run typecheck` and `npm run build`: both completed successfully.
- The user manually verified Task 6 and confirmed it passed.

### Handoff Notes

- Do not begin Task 7 until the user explicitly authorizes it.
- The timer currently calculates elapsed duration when ending a session; a
  future refinement may add per-second display updates without changing saved
  timer facts.

## 2026-07-10 - Task 7: Today Page

### What Changed

- Added the Today route page with today's duration total, session count, saved
  session list, Start Timer action, and no-records empty state.
- Preserved pending-draft recovery on Today.
- Added fake IndexedDB to shared test setup so route tests can render Today
  without unhandled IndexedDB errors.

### Verification Performed

- Ran `npm test`: six test files and twenty-four tests passed.
- Ran `npm run typecheck` and `npm run build`: both completed successfully.
- The user manually verified Task 7 and confirmed it passed.

### Handoff Notes

- Do not begin Task 8 until the user explicitly authorizes it.

## 2026-07-11 - Task 8: Log Page, Heatmap, Filters, and Record Sheet

### What Changed

- Replaced the Log route placeholder with a calendar-first Log page that
  supports previous/next month navigation, selected-day summaries, and record
  lists sourced through `SessionRepository`.
- Added reusable `CalendarHeatMap` navigation and summary modes. Navigation
  dates are keyboard-accessible buttons with full-date labels; summary cells
  remain non-interactive.
- Added a Filter Sheet for category, tag, date range, and duration range.
  Applying filters uses the existing repository AND semantics and selects the
  first matching practice day so results are immediately visible.
- Added Record Bottom Sheet view, edit, and delete-confirmation modes. It
  exposes duration/start/end as read-only fields and limits edits to category,
  tags, and note. Delete remains a confirmed hard delete.
- Added responsive styles for calendar intensity levels, record rows, sheets,
  form controls, filter-count feedback, and destructive-action treatment.

### Test-First Record

- Added CalendarHeatMap and Log page tests before production modules existed;
  the first run failed on the missing imports as expected.
- Corrected date-cell accessibility with a full-date button label after the
  component test exposed numeric-only accessible names.
- Added coverage for date selection, combined four-dimension filters, read-only
  timer facts, metadata update, delete cancellation, and confirmed hard delete.

### Verification Performed

- Ran the Task 8 suites: two files and five tests passed.
- Ran `npm test`: eight test files and twenty-nine tests passed.
- Ran `npm run typecheck`, `npm run build`, and `git diff --check`: all passed.
- The user manually verified Task 8 and confirmed it passed.

### Handoff Notes

- Do not begin Task 9 until the user explicitly authorizes it.
- `CalendarHeatMap` summary mode is ready for Task 10 Statistics and must
  remain non-interactive by default.

## 2026-07-11 - Task 9: Category and Tags Management

### What Changed

- Replaced the Category route placeholder with the `Category & Tags` management
  page and its accessible two-tab segmented control.
- Added category rows with color markers, session counts, total minutes, add,
  edit, and deletion flows. The `Uncategorized` system category intentionally
  has no delete action.
- Added tag rows with preset state and linked-session counts, plus add, edit,
  and deletion flows.
- Reused the existing category/tag repositories for all writes. Confirmed
  category deletion preserves repository migration to `uncategorized`; tag
  deletion preserves linked sessions while removing the deleted tag id.
- Updated app-shell route assertions to reflect the approved page title
  `Category & Tags`, while keeping the bottom-navigation label as `Category`.

### Test-First Record

- Added the Category page integration test before the route module existed;
  the first run failed on the missing page import as expected.
- Added seeded IndexedDB coverage for segmented list switching, category
  create/edit, category deletion with migration, tag create/edit, and tag
  deletion cleanup.

### Verification Performed

- Ran the Task 9 suite: one file and five tests passed.
- Ran `npm test`: nine test files and thirty-four tests passed.
- Ran `npm run typecheck`, `npm run build`, and `git diff --check`: all passed.
- The user manually verified Task 9 and confirmed it passed.

### Handoff Notes

- Do not begin Task 10 until the user explicitly authorizes it.

## 2026-07-11 - Task 10: Statistics Page

### What Changed

- Added `statisticsService` as the sole pure aggregation layer for total
  duration, selected week/month duration, current practice streak, session
  count, category distribution, and month heatmap data.
- Replaced the Statistics route placeholder with a route page that loads
  sessions and categories through repositories, then computes statistics in
  real time without a redundant statistics table.
- Added week/month period controls, four concise stat cards, category duration
  bars, and the reusable `CalendarHeatMap` in non-interactive summary mode.
- Kept tags fully excluded from statistics data, calculations, and UI.

### Test-First Record

- Added service tests before the statistics module existed; the first run
  failed on the missing service import as expected.
- Added a seeded Statistics page test covering category-only content,
  non-interactive summary heatmap behavior, and the absence of tag statistics.

### Verification Performed

- Ran Task 10 suites: two files and four tests passed.
- Ran `npm test`: eleven test files and thirty-eight tests passed.
- Ran `npm run typecheck`, `npm run build`, and `git diff --check`: all passed.
- The user manually verified Task 10 and confirmed it passed.

### Handoff Notes

- Do not begin Task 11 until the user explicitly authorizes it.

## 2026-07-11 - Task 11: PWA, Accessibility, and Final Regression

### What Changed

- Added a standalone SnareLab PWA icon and declared it in the web manifest.
- Tightened Workbox application-shell caching for JavaScript, CSS, HTML, PNG,
  and font assets while retaining navigation fallback to `index.html`; the
  manifest-owned icon is precached once.
- Added `useDialogFocus`, used by Record Bottom Sheet to move initial keyboard
  focus to Close and keep Tab navigation within the open sheet.
- Updated mobile Playwright route expectations for the implemented
  `Category & Tags` page title.
- Added automated PWA asset/configuration and dialog-focus regression tests.

### Verification Performed

- Ran `npm test`: thirteen test files and forty tests passed.
- Ran `npm run typecheck`, `npm run build`, and `git diff --check`: all passed.
- Inspected the generated manifest and service worker: standalone manifest icon
  is present and has exactly one precache entry.
- Ran `npm run test:ui` with mobile Playwright: six browser route/navigation
  tests passed.
- The user completed the final manual verification.

### Handoff Notes

- The V0.2 implementation plan is complete through Task 11.

## 2026-07-11 - Final Acceptance Checklist

### Acceptance Audit

- Re-read all V0.2 product, technical, UI, and implementation-plan documents,
  the complete memory bank, and the migrated prototype visual reference.
- Audited the implementation against every item in the Final Acceptance
  Checklist and preserved the frozen exclusion of BPM, time signature,
  practice targets, rhythm notes, and tag-based statistics.
- The user completed the final manual verification and confirmed acceptance.

### Acceptance Hardening

- Corrected timer accounting so paused time is excluded and the running display
  updates once per second while the timer remains entirely in memory.
- Added a reusable, focus-managed Save Session Sheet with read-only duration,
  required category selection, optional preset/custom tag multi-select, optional
  note, save-for-later, and confirmed discard behavior.
- Connected Today's pending-draft action to restore the finished draft into the
  Save Session Sheet. Running timer state remains non-persistent.
- Expanded Today records to show resolved category names, start time, duration,
  tags, and note preview, and added confirmation before discarding a meaningful
  pending draft.
- Added isolated Timer page tests and expanded timer-store coverage for paused
  duration and visible ticking behavior.

### Verification Performed

- Ran `npm test`: fourteen test files and forty-three tests passed.
- Ran `npm run typecheck`: completed without TypeScript errors.
- Ran `npm run build`: production PWA build completed and precached six entries.
- Ran `npm run test:ui`: all six mobile Chromium route/navigation checks passed.
- Ran `git diff --check`: no whitespace errors were reported.

## 2026-07-12 - V0.3 Product and Design Definition

### What Changed

- Reviewed all V0.2 product, technical, UI, and implementation-plan documents,
  the V0.2 delivered product, its final acceptance notes, and the prior visual
  reference before defining V0.3.
- Captured and confirmed the new V0.3 product direction: Today, Records, and
  Statistics become the three primary destinations; category/tag management
  moves behind a global settings entry.
- Added V0.3 requirements and design specifications covering Chinese UI copy,
  timer controls, time-line records, retained Record Bottom Sheet editing,
  local image attachments, and month/year category and tag statistics.
- Added a responsive interactive prototype that demonstrates Today, Timer,
  Save Sheet, Records, Record Detail Sheet, Statistics, Settings, Category
  Management, and Tag Management.

### Verification Performed

- Rendered the V0.3 prototype in a 390px-wide local Chromium viewport and
  exported the Today screenshot.
- Confirmed the rendered page has no horizontal overflow.
- Confirmed the prototype contains the agreed timer, save, record-detail,
  statistics-period, and settings interaction entry points.
- Reviewed V0.3 documents for placeholders and scope conflicts. The only BPM
  references remain explicit V0.3 non-goals, not product UI or data fields.

## 2026-07-12 - V0.3 Today Visual Refinement

- Updated the V0.3 Today prototype from user-provided V0.2 visual references.
- Restored the compact, divided two-metric summary layout; changed Today date
  display to the approved English short-date format (`Jul 12`).
- Reduced the monthly heatmap footprint and restored richer V0.2-style record
  cards with category, time/duration, tag chips, and note previews.
- Rendered the adjusted prototype at 390px and confirmed no horizontal
  overflow.

## 2026-07-12 - V0.3 Today Layout Follow-up

- Changed the Today title to the approved English label `Today` and retained
  the English short date `Jul 12`.
- Reworked the split metric area into a fixed two-line treatment so labels and
  values stay readable and duration units never wrap independently.
- Filled the compact heatmap's remaining horizontal space with meaningful
  month context: practice-day count and month-to-date duration.
- Removed the record expansion affordance; all records for the current day flow
  directly below the heatmap.
- Further reduced Today record-card padding and note density, then re-rendered
  at 390px with no horizontal overflow.

## 2026-07-12 - V0.3 Today Visual Alignment

- Split Today duration metrics into two independent V0.2-style cards rather
  than one divided container.
- Replaced the heatmap's bare month text with a bordered, compact monthly
  summary panel for practice days and cumulative duration.
- Removed the redundant external month label because the calendar itself owns
  month navigation and labeling.
- Restored the V0.2 prototype brand treatment: `SnareLab` uses the 28px,
  high-weight top-bar style while the Timer keeps a smaller centered brand.
- Re-rendered at 390px and re-ran the full Chromium interaction flow; the
  prototype remains interactive and has no horizontal overflow.

## 2026-07-12 - V0.3 Interactive Prototype

- Upgraded the V0.3 HTML artifact from a screen-navigation preview to an
  interactive local prototype.
- Verified start, pause/continue, reset, and stop timer behavior. Timer view
  now hides primary navigation so its control buttons remain reachable.
- Added simulated save behavior: required category enables saving, image tiles
  can be added up to the visual limit, save returns to Today, inserts a record
  card, and presents feedback.
- Added interactive record detail feedback, month/year statistics switching,
  settings navigation, and Category Management entry.
- Ran a Chromium interaction path through timer, save, records, detail sheet,
  statistics, and settings. It completed with an in-prototype save confirmation
  and no horizontal overflow at 390px.

## 2026-07-12 - V0.3 Records List Refinement

- Removed the decorative vertical guide and date-node markers from the Records
  screen. Records remain grouped by date, with each date rendered as a simple
  group title above its cards.
- Updated the V0.3 requirements and design specification to describe the
  screen as a date-grouped record list rather than a visual timeline.
- Re-ran the full local Chromium interaction path after the adjustment:
  timer, save, record detail, statistics, and settings all remained functional
  with no horizontal overflow.

## 2026-07-12 - V0.3 Statistics Visual Refinement

- Rebuilt the Statistics heatmap as a complete month view with the month name,
  month controls, weekday row, and all 31 days of July.
- Reworked both category-duration and tag-usage cards around a centered donut
  summary followed by color-coded rows containing the item name, quantity,
  percentage, and a matching proportional bar.
- Updated the V0.3 product requirements and design specification with the
  complete-month and statistical-row rules.
- Rendered the Statistics route at a 390px viewport and confirmed 31 heatmap
  cells, four distribution rows in each card, and no horizontal overflow.
- Re-ran the full interactive prototype journey after the structural update;
  timer, save, record detail, statistics period switch, and settings remained
  functional.

## 2026-07-12 - V0.3 Annual Heatmap

- Made the Statistics period control change the heatmap itself, rather than
  only its heading. The month state retains the full natural-month calendar;
  the year state now presents a compact grid of all twelve monthly heatmaps.
- Added a compact intensity legend to the annual view and retained the same
  intensity palette used for monthly practice activity.
- Verified at 390px that the annual view hides the monthly panel, renders
  twelve month groups with forty-two grid positions each, and has no
  horizontal overflow. The full prototype interaction path also passed.

## 2026-07-12 - V0.2 GitHub Pages Deployment

### What Changed

- Added a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that
  builds the Vite app and publishes `dist/` through GitHub Pages on every push
  to `main` or manual workflow dispatch.
- Made the Vite base path configurable through `VITE_BASE_PATH`. Production
  Pages builds use `/SnareLab/`, while local development retains `/`.
- Bound React Router to Vite's `BASE_URL` so route navigation remains correct
  when the app is served from the repository subpath.
- Bound the PWA manifest icon, start URL, and Workbox navigation fallback to
  the same configurable base path.
- Updated the PWA configuration test to validate base-path-aware assets.

### Verification Performed

- Ran `npm test`: fourteen test files and forty-three tests passed.
- Ran `npm run typecheck`: completed without TypeScript errors.
- Ran `VITE_BASE_PATH=/SnareLab/ npm run build`: completed successfully; the
  generated HTML and manifest point to `/SnareLab/` assets and start URL.
- Enabled GitHub Pages with GitHub Actions as its deployment source.
- GitHub Actions deployment run `29181186240` completed successfully.
- Requested `https://jellyfive.github.io/SnareLab/` and confirmed it returns
  the SnareLab document with correctly prefixed JavaScript, CSS, manifest, and
  service-worker assets.

## 2026-07-12 - PWA Install Icon

### What Changed

- Generated a custom SnareLab raster icon: a white snare drum and warm drumstick
  mark on the product's blue-purple surface.
- Added standard `192x192` and `512x512` PNG PWA icon assets alongside the
  existing SVG icon.
- Declared both PNG sizes in the web manifest; the 512px variant is marked as
  maskable for Android launcher support.

### Verification Performed

- Visually inspected the 512px output for small-icon legibility and safe
  padding.
- Ran `npm test`: fourteen test files and forty-three tests passed.
- Ran `npm run typecheck` and a `/SnareLab/` production build successfully.
- Inspected the generated manifest: it includes the 192px, 512px, and SVG
  icon declarations and precaches seven shell assets.

## 2026-07-12 - V0.3 Task 1: Attachment Data Contract and Migration

### What Changed

- Added the `ImageAttachment` domain type with identifier, compressed Blob,
  MIME type, filename, byte size, creation time, and display order.
- Added required `attachments` arrays to `PracticeSession` and
  `PendingSessionDraft`; newly saved sessions initialize the array to empty.
- Added Dexie database version 3. Its migration adds an empty attachments
  array to each V0.2 session while preserving all existing timer facts and
  metadata.

### Test-First Record

- Added a V0.2-to-V0.3 IndexedDB upgrade test before the migration existed.
- Confirmed the test failed because an upgraded V0.2 record lacked the
  `attachments` field.
- Added the smallest schema and migration change to make the test pass.

### Verification Performed

- Ran `npm test`: fourteen test files and forty-four tests passed.
- Ran `npm run typecheck`: completed without TypeScript errors.
- Ran `npm run build`: production PWA build completed successfully.
- Ran `git diff --check`: no whitespace errors were reported.
- The user manually opened existing V0.2 data and confirmed the migration
  preserved records and metadata.

### Handoff Notes

- Do not begin V0.3 Task 2 until the user explicitly authorizes it.
- This task establishes the attachment contract only. Browser image selection,
  compression, image-grid UI, and Blob-safe pending-draft persistence remain
  scoped to Tasks 3 and 4.

## 2026-07-12 - V0.3 Task 2: Application Shell, Navigation, and Settings

### What Changed

- Replaced the four-item V0.2 primary navigation with the V0.3 destinations:
  今日, 记录, and 统计. The new Records route is `/records`; the old `/log`
  address redirects to it for compatibility.
- Removed Category from primary navigation and routed the old `/category`
  address back to Today. Classification management now has its future home in
  the global settings layer.
- Added a reusable `AppHeader` on Today, Records, and Statistics, with a
  global settings trigger. The Timer route remains intentionally free of
  bottom navigation.
- Added the accessible V0.3 settings panel with 分类管理, 标签管理, and a
  disabled 页面主题 / 即将开放 row. Management flows remain scoped to Task 8.
- Added the SnareLab vector brand mark at `src/assets/snarelab-mark.svg`: a
  compact dark rounded square, snare outline, crossed indigo sticks, and timing
  tick. Top headers display it at 30px beside a small indigo SnareLab wordmark.

### Verification Performed

- Ran `npm test`: sixteen test files and forty-six tests passed.
- Ran `npm run test:ui`: five mobile Chromium route and navigation tests
  passed.
- Ran `npm run typecheck` and `npm run build`: both completed successfully.
- Captured a 390px local Chromium screenshot: settings opened, navigation had
  exactly three items, the brand mark rendered, and no horizontal overflow
  occurred.
- Ran `git diff --check`: no whitespace errors were reported.
- The user manually verified the Task 2 shell, settings panel, routing, and
  top brand mark.

### Handoff Notes

- Do not begin V0.3 Task 3 until the user explicitly authorizes it.
- The existing V0.2 body content remains intentionally in place. The full V0.3
  Today, Records, and Statistics content is scheduled for Tasks 5, 6, and 10.

## 2026-07-12 - V0.3 Task 3: Image Compression and Attachment Grid

### What Changed

- Added `imageAttachmentService` for browser-local image validation and JPEG
  compression. It rejects non-image input and retries output at progressively
  smaller dimensions and lower quality until it is at or below 2MB; otherwise
  it returns a clear Chinese error.
- Added the six-image capacity rule plus pure attachment deletion and reordering
  helpers. Both helpers normalize the saved display order for reuse by later
  save and edit flows.
- Added the reusable fixed three-column `ImageAttachmentGrid` component with
  accessible add/delete controls, loading/error inputs, max-count feedback,
  and object-URL cleanup on unmount or image replacement.

### Test-First Record

- Added failing tests before implementation for non-image rejection, compressed
  output, the 2MB rejection path, six-image capacity, ordering, and grid
  controls.
- A first green run exposed a real ordering bug: normalizing after a move
  re-sorted by stale order values. The helper now preserves the caller's chosen
  sequence and only rewrites the resulting indices.

### Verification Performed

- Ran `npm test`: eighteen test files and fifty-three tests passed.
- Ran `npm run typecheck` and `npm run build`: both completed successfully.
- Ran `npm run test:ui`: five mobile Chromium route and navigation tests
  passed.
- Ran `git diff --check`: no whitespace errors were reported.
- The user manually verified that existing product flows remained functional.

### Handoff Notes

- Do not begin V0.3 Task 4 until the user explicitly authorizes it.
- Task 3 deliberately does not mount image selection in a product flow. Task 4
  is the first integration point, in the Save Session Bottom Sheet.

## 2026-07-12 - V0.3 Task 4: Timer and Save Bottom Sheet

### What Changed

- Rebuilt `/timer` as a focused circular timer with Chinese start, pause,
  resume, reset, finish, and back controls. Reset and draft discard both
  require confirmation; paused time is still excluded by the existing timer
  store.
- Replaced the legacy English save form with the Chinese `保存本次练习` Bottom
  Sheet. It owns required category selection, optional tags and note, image
  attachments, and inline creation of a category or tag with auto-selection.
- Added Dexie version 4 and a `pendingDrafts` table. "稍后保存" now persists
  a single full draft, including Blob attachments, selected metadata, and
  note. A legacy localStorage-only draft is migrated on first read.
- Kept the finished timer draft stable across category/tag refreshes, fixing
  the case where confirming a newly created tag cleared the selected category.
- Rendered the save panel through a body-level Portal. The modal now uses the
  dynamic viewport, a centered full-viewport backdrop, internal scrolling,
  safe-area padding, and sticky save actions for iPhone-sized screens.

### Verification Performed

- Added test-first coverage for Blob-safe pending-draft persistence, the
  `pendingDrafts` table, Chinese save controls, category-required saving,
  explicit recovery, and the category-preservation regression.
- Ran `npm test`: eighteen test files and fifty-four tests passed.
- Ran `npm run build`: production PWA build completed successfully.
- Ran `npm run test:ui`: five mobile Chromium flows passed, including timer
  pause/resume/finish, save-panel control reachability, and modal centering.
- The user manually verified the timer controls, save sheet, custom category
  dropdown, new tag/category flow, mobile scrolling, and centered iPhone
  layout.

### Handoff Notes

- Do not begin V0.3 Task 5 until the user explicitly authorizes it.
- `PendingSessionDraft` is intentionally a full metadata draft in V0.3;
  do not move attachments back into localStorage or create a second draft
  persistence path.

## 2026-07-12 - V0.3 Task 5: Today Page and Draft Recovery Regression

### What Changed

- Rebuilt the Today route around the V0.3 information hierarchy: compact
  separate cards for today's and cumulative duration, a primary practice entry
  action, a compact monthly heatmap with month summary, and an always-expanded
  list of today's Chinese record cards.
- Kept the V0.2 density and visual rhythm where requested while adopting the
  V0.3 route labels, Chinese copy, small SnareLab mark, and English `Today` /
  short-date exceptions.
- Added a recovery-save safeguard: a persisted pending draft remains the
  source for its metadata, but a final `PracticeSession` receives a new record
  identifier. This prevents a pending-draft identifier from colliding with a
  formal saved session.
- Added an in-sheet save error state and disabled duplicate save actions while
  persistence is in progress. Also corrected the tag quick-add cancel handler
  so it only affects its own form state.

### Test-First Record

- Added Today-page coverage for the compact metric layout, monthly data, and
  full record list.
- Added a failing recovery test before the save-path correction: it persists a
  finished draft with category, tags, note, and attachments, then verifies that
  `保存记录` creates a session and clears `pendingDrafts`.

### Verification Performed

- Ran `npm test`: nineteen test files and fifty-nine tests passed.
- Ran `npm run build`: TypeScript and the production PWA build completed
  successfully.
- Ran `npm run test:ui`: six mobile Chromium route, layout, timer, and
  navigation checks passed.
- The user manually verified the Today redesign and the full `稍后保存 →
  继续保存 → 保存记录` flow.

### Handoff Notes

- Task 5 is complete. Do not begin Task 6 until the user explicitly authorizes
  it.
- Finalized sessions and pending drafts are different persistence concepts:
  never pass a pending draft's `id` into `SessionRepository.saveSession`.

## 2026-07-13 - V0.3 Task 6: Records Timeline and Classification Filters

### What Changed

- Replaced the V0.2 calendar-first Log interaction with the V0.3 `/records`
  page: records are sorted newest first, grouped by the local `startTime`
  date, and opened from compact clickable cards.
- Added the confirmed information timeline treatment: a thin left-side line
  joins date nodes and record-time nodes; weekdays remain neutral, while each
  start time uses a lighter indigo treatment for rapid scanning.
- Reduced record-card density for a browsing surface. Cards display category,
  duration, at most two tags, note preview, and image count, without the
  earlier internal category-color bar.
- Reduced the visible filter UI to category and tag selection. The repository
  still preserves its broader historical query capability, but date range and
  duration controls are no longer part of the V0.3 records experience.
- Added Chinese filter summaries, an explicit clear action, and a Chinese
  no-results state. Selecting a record continues to open the existing detail
  Bottom Sheet; its V0.3 detail/edit redesign remains Task 7.

### Test-First Record

- Replaced the old selected-day/calendar page tests with failing tests for
  descending local-date groups, compact timeline semantics, Chinese labels,
  two-tag truncation, image counts, category/tag combination filters, clear
  filters, empty results, and the detail entry point.
- Added a mobile browser regression for the records filter and empty state.

### Verification Performed

- Ran `npm test`: nineteen test files and fifty-nine tests passed.
- Ran `npm run build`: TypeScript and production PWA builds completed
  successfully.
- Ran `npm run test:ui`: seven mobile Chromium checks passed.
- Ran targeted record-page tests and TypeScript checks after the timeline
  alignment, card-accent removal, and indigo-time refinements.
- The user manually verified the records timeline, its node alignment, compact
  typography, filters, and indigo time labels.

### Handoff Notes

- Task 6 is complete. Do not begin Task 7 until the user explicitly authorizes
  it.
- Preserve the information timeline as a Records-only browsing aid. It does
  not turn Today into a detail entry point or replace the Bottom Sheet detail
  flow.

## 2026-07-13 - V0.3 Task 7: Record Detail and Attachment Editing

### What Changed

- Completed the Records-only detail flow in `RecordBottomSheet`. The view and
  edit states stay inside one Chinese Bottom Sheet; it does not create a
  route-level detail page.
- Timer facts remain read-only. The sheet now presents duration plus one
  compact `练习时间` row in the form `开始时间 - 结束时间`; it never submits
  duration or timestamps when saving changes.
- Editing now persists category, tags, note, and the full attachment array.
  Attachments can be added, deleted, and moved earlier or later in their
  fixed three-column grid. The attachment service continues to apply browser
  compression, the 2MB cap, and the six-image limit.
- Extracted the V0.3 custom category picker so the timer save sheet and record
  editor share the same color-dot, listbox, and selected-state interaction.
- Kept hard deletion in a separate confirmation state. It states that the
  operation cannot be recovered, closes after a successful deletion, and the
  Records page reloads its repository-backed data.

### Verification Performed

- Added coverage for Chinese read-only facts, the combined time row, custom
  category selection, image deletion and ordering controls, metadata-only
  save payloads, save errors, Escape close, delete confirmation, and automatic
  close after deletion.
- Added repository coverage that attachment updates persist without changing
  timer facts, plus a browser regression that saves a record, edits it from
  `/records`, and hard deletes it.
- Ran `npm test`: nineteen test files and sixty-five tests passed.
- Ran `npm run typecheck`, `npm run build`, and `npm run test:ui`: all passed;
  the browser suite completed eight mobile flows.
- The user manually verified the combined practice-time row and the shared
  category picker in the detail editor.

### Handoff Notes

- Task 7 is complete. Do not begin Task 8 until the user explicitly authorizes
  it.
- Keep record detail fields limited to category, tags, note, and attachments.
  `duration`, `startTime`, and `endTime` are immutable timer facts.

## 2026-07-13 - V0.3 Task 8: Settings Classification Management

### What Changed

- Connected the global Settings panel to the only primary entry points for
  category and tag management. Theme remains visibly disabled as `即将开放`.
- Replaced the interim management Bottom Sheet list with a focused full-screen
  management surface for both classifications: search, usage/name sorting,
  count summaries, colored identity dots, and a compact per-item more menu.
- Added consistent `新建 / 编辑` Sheets for categories and tags. The forms use
  the same field, section, action, and color vocabulary as other V0.3 Sheets;
  both offer preset colors plus a custom color control. Categories additionally
  retain their icon field.
- More menus now expose rename/color editing, usage statistics, and deletion.
  Statistics show record count, accumulated duration, and the most recent
  practice date for the selected category or tag.
- Retained the data rules: `未分类` is editable but cannot be deleted; category
  deletion migrates related sessions to `uncategorized`; tag deletion removes
  only that tag relationship while preserving sessions.
- Added a shell-level classification revision signal. A successful management
  change refreshes Today, Timer save, Records filters/detail, and Statistics.
  Built-in labels display their Chinese defaults only while their persisted
  English default names remain unchanged, so renamed built-ins are visible.
- Corrected preset tag seeding to compare identifiers rather than names. A
  renamed preset tag is no longer recreated on a subsequent refresh.

### Verification Performed

- Added test-first coverage for settings actions, management creation,
  category migration, tag cleanup, search, more menus, editing controls,
  color selection, statistics, and the renamed-preset seeding regression.
- Ran `npm test`: twenty-one test files and seventy-three tests passed.
- Ran `npm run typecheck` and `npm run build`: both passed.
- Ran `npm run test:ui`: nine mobile Chromium flows passed, including settings
  management, selector refresh, and no horizontal overflow.
- The user manually verified the full-screen category/tag management UI and
  the aligned create/edit Sheets.

### Handoff Notes

- Task 8 is complete. Do not begin Task 9 until the user explicitly authorizes
  it.
- Classification management is a settings workflow, not a primary route. Keep
  its full-screen management surface separate from the small Settings panel;
  closing it returns to Settings.
- Keep `ensurePresetTags` idempotent by preset `id`, never by mutable display
  name. Use `classificationLabels` for visible default translations so user
  renames remain authoritative.

## 2026-07-13 - V0.3 Task 9: Month and Year Statistics Aggregation

### What Changed

- Extended `statisticsService` with V0.3 `month` and `year` periods while
  retaining the temporary `week` period required by the unreworked statistics
  screen.
- Period filtering now uses local calendar boundaries based on `startTime`:
  natural month or natural year through the current local day. The returned
  heatmap therefore contains only practice days in the selected period.
- Added independent `todayDuration`, all-time `totalDuration`, current-period
  duration, and the existing current streak. No summary table is introduced;
  all values remain calculated from saved session facts.
- Category distribution is scoped to the selected period and reports duration,
  session count, and percentage. Percentages use largest-remainder allocation
  so displayed values always sum to 100%.
- Added tag distribution for the selected period. Each tag association counts
  once, so its denominator is total tag usage rather than practice duration;
  sessions with multiple tags contribute to each selected tag.

### Verification Performed

- Added service tests for natural-month filtering, today versus period totals,
  cross-year annual boundaries, category-duration percentages, tag many-to-many
  counts, and empty data without division by zero.
- Ran the focused statistics service suite: six tests passed.
- Ran `npm test`: twenty-one test files and seventy-six tests passed.
- Ran `npm run build`: TypeScript checks and the production build passed.
- The user manually verified Task 9.

### Handoff Notes

- Task 9 is complete. Do not begin Task 10 until the user explicitly authorizes
  it.
- Task 10 should consume `StatisticsResult` rather than re-aggregate raw
  sessions in `StatisticsPage`. Its month/year UI must use `heatmap`,
  `categoryDistribution`, and `tagDistribution` together.

## 2026-07-13 - V0.3 Task 10.1: Statistics Overview Drilldown

### What Changed

- Rebuilt the Statistics overview as a year-first view with an annual summary,
  twelve miniature month heatmaps, and a month-summary list.
- Added the overview-to-month-to-day drilldown. A saved month opens a complete
  natural-month calendar, and any date opens a detail using only persisted
  practice data.
- The month view shows the selected month's duration, practice days, session
  count, and category-duration distribution. The day view shows duration,
  session count, category count, and its saved records.
- Day records reuse the existing `RecordBottomSheet`, retaining one edit and
  hard-delete flow rather than creating a second detail page.
- A day-detail back action returns to its parent month; the month-detail back
  action returns to the annual overview.

### Verification Performed

- Added tests for annual-to-month-to-day navigation, the record-detail entry
  point, empty annual data, completed historical-month summaries, current
  month cut-off at the current day, and chronological day records.
- Ran `npm test`: twenty-one test files and eighty tests passed.
- Ran `npm run typecheck`, `npm run build`, `npm run test:ui`, and
  `git diff --check`: all completed successfully. Browser regression covered
  the annual overview at mobile and desktop widths without horizontal overflow.
- The user manually verified Task 10.1 and confirmed the feature behavior.

### Handoff Notes

- Task 10.1 is complete. Task 10.2 may now enable the Category and Tag tabs.
- Task 10.2 must change tag reporting from the old usage-count rule to the
  approved many-to-many duration rule. A session's full duration belongs to
  every attached tag, so tag percentages may total more than 100%.

## 2026-07-13 - V0.3 Statistics Annual Overview Visual Refresh

### What Changed

- Reworked the approved annual overview into the V0.3 reference hierarchy:
  year control, four compact annual metrics, a week-column annual heatmap,
  intensity legend, and recent-month summaries with miniature activity strips.
- The annual heatmap now renders 53 Monday-first week columns rather than
  twelve independent mini calendars. Month rows begin with the current month,
  show five rows by default, and can reveal earlier months without changing
  the existing month-detail navigation.
- Kept all statistics derived from saved sessions and retained the indigo
  intensity system. No rhythm, BPM, calorie, comparison, or mood fields were
  added.

### Verification Performed

- Added annual heatmap structure coverage and retained the annual-to-month
  drilldown test.
- Ran the full unit suite (82 tests), TypeScript check, production build, and
  mobile browser regression. The mobile visual check confirmed 53 week columns
  with no horizontal overflow.
- The user accepted the annual overview and authorized the monthly visual work.

### Handoff Notes

- Annual overview is accepted. Do not alter it while implementing the monthly
  page unless a cross-view consistency issue requires a shared component fix.
- The next visual checkpoint is the monthly detail page; daily detail remains
  unchanged until the user verifies the monthly result.

## 2026-07-13 - V0.3 Statistics Monthly Detail Visual Refresh

### What Changed

- Reframed the month detail as a focused drilldown: a centered month title
  with return control, a complete Monday-first calendar heatmap, an indigo
  intensity legend, compact category distribution, and the three most recent
  records for the month.
- Removed the superseded monthly summary cards and in-calendar month controls
  so the page follows the approved reference hierarchy. Each heatmap day
  remains the entry point to the existing daily detail.
- Added compact Chinese duration labels inside calendar cells. Values such as
  ninety minutes display as `90分`, avoiding truncation at phone widths.
- Reused `RecordBottomSheet` for recent-record entry, preserving one detail
  and editing flow. Added a statistics-service helper to return the current
  month's saved sessions in reverse chronological order.

### Verification Performed

- Added month-detail assertions for the calendar title, daily duration labels,
  recent-record list, and record entry point.
- Ran the focused statistics and calendar suites, the full unit suite (82
  tests), TypeScript check, production build, browser regression, and a
  populated mobile visual check with no horizontal overflow.
- The user authorized Task 11 after reviewing the monthly page.

### Handoff Notes

- Month detail is accepted. The calendar duration mode is opt-in and must not
  alter the compact Today or Records calendars.
- Task 11 is the final visual, offline, PWA, and regression sweep. It should
  include the daily detail presentation rather than reopening the annual or
  month layouts without a specific finding.

## 2026-07-13 - V0.3 Task 11: Final Visual, PWA, and Offline Acceptance

### What Changed

- Completed the final statistics drilldown presentation. Daily detail now has
  a centered date header, a balanced return action, compact real-data metrics,
  chronological record entry points, and a duration-based category
  distribution; record editing still uses the existing Bottom Sheet.
- Completed the V0.3 visual and behavioral review for Today, Timer, save
  sheets, Log, record detail, Statistics, Settings, and classification
  management. No fields outside the approved local practice model were added.
- Confirmed the release configuration keeps the PWA manifest, Workbox shell,
  installation icons, and GitHub Pages `/SnareLab/` base path aligned.

### Verification Performed

- Ran `npm test`: 21 test files and 82 tests passed, including IndexedDB
  migrations, drafts, attachments, filtering, metadata edits, hard deletion,
  classification cleanup, and statistics aggregation.
- Ran `npm run typecheck`, normal production build, and a production build
  with `VITE_BASE_PATH=/SnareLab/`; all passed and generated the PWA service
  worker and manifest.
- Ran `npm run test:ui`: all 11 mobile-browser flows passed, covering layout,
  navigation, timer/save, detail edit/delete, and classification management.
- Captured the 390px day-detail screen with populated local data. It reported
  no horizontal overflow, rendered the centered day title, and showed the
  category distribution.
- The user requested the V0.3.1 release and GitHub Pages publication after
  final review.

### Handoff Notes

- V0.3 implementation is complete as V0.3.1. Future work should start from
  the persisted local-first boundaries rather than adding parallel data stores
  or record-detail screens.

## 2026-07-13 - V0.3.2 PWA Icon Alignment

### What Changed

- Replaced the standalone PWA SVG and its 192px/512px raster exports with the
  same SnareLab mark used by the application header and Timer page.
- Added a PWA asset regression assertion requiring the public SVG installation
  icon to exactly match `src/assets/snarelab-mark.svg`.

### Verification Performed

- Ran the PWA asset test and production build successfully. The resulting
  manifest and service worker include the aligned raster installation icons.

## 2026-07-13 - V0.4.0 Task 1: Rhythm Types and Dexie v5 Schema

### Context

- Re-read the V0.4 design, implementation plan, prototype, and both memory-bank
  files before implementation.
- The user explicitly authorized in-place execution on `main`; existing
  uncommitted V0.4 documents and prototype assets were preserved.
- Task 1 is a data foundation only. It does not add the Editor route, Canvas,
  repository, audio engine, samples, or any Practice Log integration.

### What Changed

- Added `src/types/rhythm.ts` with the stable eight-track identifiers,
  `RhythmTrack`, extensible `RhythmNote`, `RhythmDocument`, and singleton
  `EditorPreferences` contracts.
- Re-exported rhythm contracts from the shared type boundary.
- Added Dexie version 5 with `rhythmDocuments` and `editorPreferences`, while
  retaining all four V0.3 table definitions unchanged.
- Added exact schema assertions, a v4-to-v5 preservation test, and round-trip
  coverage for rhythm documents and editor preferences.

### Test-First Record

- Added the V0.4 type, table, and migration expectations before production
  changes.
- Confirmed the focused RED run failed in three expected places: missing track
  constants and both missing tables.
- Added the minimal type and Dexie definitions, then confirmed the focused
  database suite became green.
- A read-only code review identified that partial migration assertions were
  too weak. The test was strengthened to compare all legacy top-level fields,
  every attachment metadata field and Blob presence, exact indexes, and new
  store round trips. Follow-up review reported no remaining issues.

### Verification Performed

- Baseline before Task 1: 21 test files and 82 tests passed.
- Final automated suite: 21 test files and 85 tests passed.
- `npm run typecheck` completed without TypeScript errors.
- `npm run build` completed and generated the production PWA assets with 10
  precache entries.
- `git diff --check` reported no whitespace errors.
- The user manually verified the existing V0.3 application data and approved
  Task 1.

### Handoff Notes

- Task 1 is complete. Task 2 may implement timing constants and immutable edit
  commands, but must not add repositories, Canvas UI, or audio behavior.
- Keep the v5 transition mutation-free and keep rhythm data isolated from
  `PracticeSession`.

## 2026-07-13 - V0.4.0 Task 2: Rhythm Timing and Immutable Edit Commands

### Context

- Re-read the V0.4 Task 2 plan, design rules, V0.4 architecture foundation,
  and the latest process log before implementation.
- A plan/example conflict was found before code: the design required Solo mode
  to remain active when all Solo tracks are muted, while the old example would
  fall back to non-Solo tracks. The user confirmed that all-muted Solo tracks
  must produce silence, and the plan example was corrected.
- Task 2 remains a pure domain milestone. It adds no Dexie access, Store,
  repository, Canvas, route, component, or audio engine.

### What Changed

- Added shared constants for PPQ, Step, measure, BPM, and measure-count bounds.
- Added validated conversions from measure/Step to Tick, Tick to seconds, and
  document measure count to its exclusive end Tick.
- Added immutable commands for default document creation, note toggle,
  measure append/remove, current/all-note clearing, BPM, and Mute/Solo.
- Added audible-track selection with the confirmed Solo-mode and Mute-priority
  semantics.
- Added strict tests for invalid numeric input, cell bounds, note uniqueness,
  1–16 measures, deletion Tick shifting, immutability, `updatedAt`, no-op
  identity, and all Mute/Solo combinations required by the task.

### Test-First Record

- Timing tests were written first and failed because `rhythmTiming` did not
  exist; the minimal constants and conversion module made 18 tests green.
- Command tests were written next and failed because `rhythmCommands` did not
  exist; the minimal immutable command implementation made 12 tests green.
- Added a final successful/no-op `updatedAt` regression, bringing the domain
  suite to 31 tests.
- The final read-only source review found no Critical, Important, or Minor
  issues and marked Task 2 ready to merge.

### Verification Performed

- Task 2 domain suite: 2 test files and 31 tests passed.
- Full suite: 23 test files and 116 tests passed.
- `npm run typecheck` completed without TypeScript errors.
- `npm run build` completed and generated the production PWA assets with 10
  precache entries.
- `git diff --check` reported no whitespace errors.
- The user reviewed the domain behavior and approved Task 2.

### Handoff Notes

- Task 2 is complete. Task 3 may add the rhythm document repository, editor
  session Store, and autosave hook on top of these pure commands.
- Task 3 must not duplicate Tick calculations or edit transformations, and it
  must not add the Canvas or Web Audio engine.

## 2026-07-13 - V0.4.0 Task 3: Rhythm Documents, Editor History, and Autosave

### Context

- Re-read the V0.4 Task 3 plan, document-management and module-boundary rules,
  prototype, and both memory-bank files before implementation.
- Task 3 is an infrastructure milestone only. It adds no Editor route, Canvas,
  responsive workbench, audio engine, samples, or Practice Log integration.

### What Changed

- Added `RhythmDocumentRepository` as the sole Dexie boundary for rhythm
  documents and editor preferences, including validated create/save/rename,
  newest-first listing, remembered-document recovery, and transactional delete
  with automatic fallback/default creation.
- Added `useEditorStore` with immutable document replacement, a 100-snapshot
  Undo/Redo limit, Redo branch clearing, history reset on document switch, and
  explicit save feedback.
- Kept BPM and Mute/Solo outside Grid history while rebasing those values into
  existing history snapshots so later Undo/Redo cannot accidentally revert
  them.
- Added `useRhythmDocumentAutosave` with 300ms debounce, rapid-edit coalescing,
  immediate flush, same-document retry, failure preservation, and monotonic
  stale-write protection across edits, unmounts, and new hook instances.

### Test-First Record

- Added repository, Store, and fake-timer hook tests first; all three suites
  failed because the implementation modules were absent, then became green
  after the minimal boundaries were added.
- The first independent review found three interleaving/runtime gaps: non-Grid
  settings could be reverted by Grid history, an unmounted save could overwrite
  a newer hook instance, and reserved note metadata was not fully validated.
  Each received a failing regression test before its fix.
- Follow-up review found that a truthy non-string document ID could reach
  IndexedDB and break deterministic sorting. A final red/green regression
  tightened root IDs to trimmed non-empty strings. Final review reported no
  remaining issues and marked the task ready for manual validation.

### Verification Performed

- Task 3 focused suite: 3 test files and 22 tests passed.
- Full suite: 26 test files and 138 tests passed.
- `npm run typecheck` completed without TypeScript errors.
- `npm run build` completed and generated the production PWA assets with 10
  precache entries.
- `git diff --check` reported no whitespace errors.
- The user approved the repository, history, and autosave behavior.

### Handoff Notes

- Task 3 is complete. Task 4 may add pure Canvas geometry, high-DPI rendering,
  click/keyboard cell editing, and accessible announcements on top of the Store.
- Task 4 must reuse `stepToTick`, `toggleNote`, and `useEditorStore.applyEdit`;
  it must not access Dexie directly or add audio scheduling.

## 2026-07-13 - V0.4.0 Task 4: Canvas Geometry and Accessible Grid Editing

### Context

- Re-read the approved V0.4 Task 4 plan, Grid interaction rules, prototype, and
  both memory-bank files before implementation.
- Task 4 provides a reusable Grid primitive only. It does not add the Editor
  route, document toolbar, track controls, measure UI, autosave wiring, or audio.

### What Changed

- Added pure fixed-layout geometry for exact Canvas dimensions, hit testing,
  cell rectangles, 1–16 measure widths, and clamped keyboard cursor movement.
- Added a high-DPI Canvas Grid with visually weighted Step, beat, and measure
  lines, track-colored notes, a controlled cursor, click/touch activation, and
  pointer-captured drag suppression.
- Added accessible `grid > row > gridcell` semantics without one DOM node per
  visible cell, including normalized row/column metadata, instrument/note state,
  arrow navigation, Space/Enter toggling, and polite action announcements.
- Split Canvas sizing from redraws, capped high-DPR backing allocation for the
  8192px sixteen-measure case, and moved the playback head to a transform-only
  DOM overlay so future animation frames do not redraw the complete Grid.

### Test-First Record

- Geometry and component tests were written first and failed because both
  implementation modules were absent. The initial implementation made eight
  focused tests green.
- Independent review found repeated backing allocation, incomplete drag
  tracking, unsafe DPR-3 maximum width, missing ARIA row ownership, and a stale
  out-of-range cursor lookup. Each issue received a failing regression test.
- Follow-up review found full-Canvas playhead redraws and missing explicit
  pointer capture. The playhead was separated into a DOM overlay and pointer
  capture/release was added before final review reported no remaining issues.

### Verification Performed

- Task 4 focused suite: 2 test files and 12 tests passed.
- Full suite: 28 test files and 150 tests passed.
- `npm run typecheck` completed without TypeScript errors.
- `npm run build` completed and generated the production PWA assets with 10
  precache entries.
- `git diff --check` reported no whitespace errors.
- The user approved the Canvas geometry, input, rendering, and accessibility
  behavior.

### Handoff Notes

- Task 4 is complete. Task 5 may mount the Grid in `/editor`, connect Store and
  repository flows, add document/measure/track controls, and build the responsive
  mobile/tablet/desktop workbench.
- Task 5 must keep the Canvas visual-only, call `flush` before document switches,
  and use the existing domain commands for every document edit.

## 2026-07-14 - V0.4.0 Task 5: Responsive Silent Grid Editor

### Context

- Re-read the V0.4 Task 5 plan, route, document-management, responsive, and
  module-boundary rules before implementation.
- This milestone deliberately excludes audio playback, samples, Transport,
  Library, score, Count-in, and metronome placeholders.

### What Changed

- Added `/editor`, the fourth `编辑` primary-navigation item, and an editor-only
  wide application shell.
- Added `EditorPage` to restore the last valid document, coordinate Store,
  repository, Canvas Grid, document CRUD, measure operations, Mute/Solo, and
  explicit save feedback.
- Added focus-managed toolbar dialogs for rename/delete, destructive measure
  confirmations, eight bilingual track rows, and responsive fixed-track/Grid
  scrolling workbench layouts.
- Extended autosave `flush` and `retry` with success results so document changes
  cannot discard a document whose latest in-memory write failed.

### Test-First Record

- Route/navigation tests first failed because `/editor` redirected to Today and
  only three primary links existed; page and toolbar tests then failed because
  their modules were absent.
- Added repository-backed tests for restoration, switch flushing and preference
  persistence, final-document replacement, failed-save retention, and pending
  save flushing on page exit.
- Independent review found a failed-flush data-loss path, missing leave-page
  flush, stale local view state after transitions, and rename-dialog focus
  restoration. Regression tests guided each fix; final review had no issues.

### Verification Performed

- Task 5 focused suite: 4 test files and 21 tests passed.
- Full suite: 30 test files and 158 tests passed.
- `npm run typecheck`, `npm run build`, PWA generation, and `git diff --check`
  all passed.
- Browser checks at 390×844, 1024×768, and 1440×900 confirmed no whole-page
  horizontal overflow, fixed track labels, isolated Grid scrolling, and no
  console errors.
- The user approved document CRUD, Grid editing, Mute/Solo, responsive layout,
  and silent-editor scope.

### Handoff Notes

- Task 5 is complete. Task 6 may add licensed local drum samples and the Web
  Audio engine while preserving the EditorPage orchestration boundary.
- Existing injected playback-stop callbacks are the intended integration seam;
  scheduling must remain outside React rendering and Canvas code.

## 2026-07-14 - V0.4.0 Task 6: Local Drum Samples and Web Audio Engine

### What Changed

- Added eight stereo PCM WAV samples with complete CC0 provenance, source
  mapping, retrieval date, and no-modification record in
  `public/audio/drum-kit/LICENSE.md`.
- Added base-path-safe `SAMPLE_MANIFEST` and a React-free `RhythmAudioEngine`
  with injectable AudioContext, fetch, and interval dependencies.
- Implemented decoded-buffer caching, shared master gain, 25ms wakeups with a
  100ms AudioContext-clock look-ahead window, tick/track ordering, velocity,
  Mute/Solo, pause/resume, stop, loop/non-loop, BPM changes, errors, and cleanup.
- Updated Workbox asset globbing and tests so all eight WAV assets are
  precached in production builds.

### Test-First Record

- Added fake AudioContext scheduler tests before the engine module existed.
- A failing BPM-change regression fixed duplicate notes already inside the
  scheduling window. Independent review then added failing coverage for
  unsupported Web Audio and all eight PWA asset files; follow-up review found
  no remaining issues.

### Verification Performed

- Full suite: 31 files / 170 tests passed; `npm run typecheck`, `npm run build`,
  and `git diff --check` passed.
- Production Workbox output contains all eight `audio/drum-kit/*.wav` entries
  and reports 18 precache entries.
- The user approved the sample-license record and Task 6.

### Handoff Notes

- Task 7 owns the React lifecycle and visible Transport controls. It must stop
  the engine on document change, navigation, unmount, and page visibility
  changes; it must not schedule notes from React or Canvas.

## 2026-07-14 - V0.4.0 Task 7: Editor Transport and Playback

- Added accessible Chinese Transport controls for play/pause/stop, BPM, loop,
  and master volume, including loading/error feedback.
- `useEditorAudio` owns one engine per EditorPage mount, subscriptions,
  requestAnimationFrame playhead display, lifecycle cleanup, and visible
  playback-start error state.
- BPM and Mute/Solo remain non-Undo document changes, immediately update audio,
  and retain existing autosave. The user approved manual playback checks.
- Full verification: 33 test files / 179 tests, typecheck, production PWA build,
  and diff check passed; independent review verified the rejection regression.

## 2026-07-14 - V0.4.0 Task 8: Offline and Responsive Editor Acceptance

- Added Playwright editor journeys for mobile 390×844, tablet 1024×768, and
  desktop 1440×900: navigation, isolated Grid overflow, edit/mixer persistence,
  play/pause/stop/navigation lifecycle, and service-worker offline reload.
- The E2E suite found and fixed a stale-render race where an immediate Mute or
  Solo update could overwrite a just-added Grid note. Mixer and BPM handlers now
  read the latest Store document before applying their non-history update.
- All 12 editor E2E cases passed across the three viewports, including offline
  service-worker reload; the user completed manual offline acceptance.

## 2026-07-14 - V0.4.0 Release Acceptance

- Final release verification passed: 33 Vitest files / 179 tests; TypeScript;
  production PWA build with 18 Workbox precache entries; and 45 Playwright
  browser tests covering V0.3 regression plus V0.4 editor journeys at mobile,
  tablet, and desktop widths.
- Confirmed V0.4 non-goals remain absent: Library, score, Count-in, metronome,
  multiple kits, variable subdivision, track CRUD, and PracticeSession writes.
- The editor remains isolated from Practice Log data and statistics. V0.3 Today,
  timer, records, settings, and statistics browser journeys all passed.
