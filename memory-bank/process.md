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
