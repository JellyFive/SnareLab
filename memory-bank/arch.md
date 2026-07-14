# Architecture Notes

## Current Stage

The repository contains the accepted SnareLab Practice Log v0.3.2 product and
has started the V0.4.0 Grid Editor implementation. V0.4.0 Tasks 1–5 provide the
rhythm document contract, Dexie v5 storage, pure edit commands, document
repository, editor history Store, reliable autosave, and an accessible Canvas
Grid primitive plus the silent responsive Editor workbench. Playback engine,
audio samples, and Transport remain later tasks.

## Source of Truth

- `docs/V0.2/SnareLab_Practice_Log_v0.2_Product_Spec.md`: product scope, frozen decisions, user flows, and non-goals.
- `docs/V0.2/SnareLab_Practice_Log_v0.2_Technical_Design.md`: target stack, data model, repositories, services, state boundaries, and testing strategy.
- `docs/V0.2/SnareLab_Practice_Log_v0.2_UI_Spec.md`: visual tokens, navigation, page layout rules, accessibility, and motion guidance.
- `docs/V0.2/implementation-plan.md`: task-by-task execution plan. Work should continue one task at a time.
- `docs/V0.2/prototypes/snarelab-v0.3-rhythm-practice-prototype.*`: migrated future-facing visual reference only. Do not implement BPM, time signature, practice target, rhythm notes, or rhythm statistics in v0.2.
- `docs/V0.3/SnareLab_Practice_Log_v0.3_Product_Requirements.md`: approved V0.3 product scope, flows, data rules, V0.2 deltas, and acceptance criteria.
- `docs/V0.3/SnareLab_Practice_Log_v0.3_Design_Spec.md`: approved V0.3 visual tokens, Chinese copy rules, control system, screen layouts, Bottom Sheet rules, and accessibility guidance.
- `docs/V0.3/prototypes/snarelab-v0.3-practice-console-prototype.html`: self-contained interactive V0.3 prototype; its matching PNG is the rendered mobile Today reference.
- `docs/V0.4/SnareLab_Grid_Editor_v0.4.0_Design_Spec.md`: approved V0.4.0 product, interaction, data, audio, responsive, and acceptance contract.
- `docs/V0.4/implementation-plan-v0.4.0.md`: test-first V0.4.0 execution plan. Work proceeds one task at a time and pauses for manual acceptance after every major task.

## V0.4.0 Rhythm Data Foundation

- `src/types/rhythm.ts` owns the Grid Editor domain contract. It defines the
  stable eight-track identifiers, persisted track Mute/Solo state, extensible
  Tick-based notes, complete rhythm documents, and the singleton editor
  preferences record.
- `RhythmDocument` is separate from `PracticeSession`. Task 1 introduces no
  relationship between rhythm documents and Today, Records, or Statistics.
- Rhythm positions use a literal 480 PPQ contract. V0.4.0 UI remains fixed to
  4/4 and sixteenth-note subdivision, while note duration, velocity,
  articulation, tie, and tuplet fields preserve future model capacity.
- `src/database/dexie.ts` owns Dexie version 5. It retains the exact V0.3
  `sessions`, `categories`, `tags`, and `pendingDrafts` schemas and adds
  `rhythmDocuments: "id, name, updatedAt"` plus
  `editorPreferences: "key, updatedAt"`.
- The v4-to-v5 transition requires no data upgrade callback because it only
  adds empty stores. Database tests verify complete legacy top-level fields,
  attachment metadata and Blob presence, exact new-table keys/indexes, empty
  initial stores, and new-record round trips.
- Task 1 intentionally exposes no rhythm repository or direct UI persistence.
  Later pages must access the new tables through the dedicated repository
  introduced in Task 3, never directly through Dexie.

## V0.4.0 Rhythm Domain Commands

- `src/features/editor/domain/rhythmConstants.ts` is the single V0.4.0 source
  for 480 PPQ, 120 ticks per sixteenth-note Step, 1920 ticks per 4/4 measure,
  1–16 measure bounds, and 40–240 BPM bounds.
- `src/features/editor/domain/rhythmTiming.ts` owns validated conversion between
  measure/Step positions, absolute ticks, document end ticks, and audio seconds.
  Invalid, non-integer, non-finite, or out-of-range inputs throw `RangeError`.
- `src/features/editor/domain/rhythmCommands.ts` owns pure immutable edits for
  default-document creation, note toggling, measure append/removal, note
  clearing, BPM changes, and track Mute/Solo changes. UI, Store, Repository,
  Canvas, and Audio code must reuse these commands rather than duplicate the
  transformations.
- A Grid cell is uniquely identified by `trackId + tick`. New V0.4.0 notes use
  a 120-tick duration, 0.8 velocity, and `normal` articulation.
- Deleting a measure removes notes inside its half-open tick range and shifts
  every later note left by exactly 1920 ticks. The original document and note
  arrays are never mutated.
- Successful state changes produce a later `updatedAt`; no-op boundary or
  unchanged-value commands return the original document object.
- Solo mode is active whenever any track has `solo: true`. Within Solo mode,
  Mute has priority and only `solo && !mute` tracks are audible. If every Solo
  track is muted, the audible set is empty and playback must remain silent;
  it must not fall back to non-Solo tracks.

## V0.4.0 Rhythm Documents, History, and Autosave

- `src/repositories/rhythmDocumentRepository.ts` is the only direct access
  boundary for `rhythmDocuments` and `editorPreferences`. It owns multi-document
  CRUD, deterministic newest-first ordering, last-document restoration, and
  default-document recovery; pages and components must not access either Dexie
  table directly.
- Repository writes validate the complete rhythm aggregate before persistence,
  including fixed timing/track rules, valid document and note identifiers,
  note uniqueness, ranges, and reserved tie/tuplet metadata. Corrupt persisted
  documents are ignored during restoration rather than opened into the editor.
- Deleting a document and choosing or creating its fallback runs in one Dexie
  transaction across both V0.4 tables. Deleting the final document therefore
  cannot leave the editor without a remembered default document.
- `src/store/editorStore.ts` owns only the active in-memory document, save
  feedback, and up to 100 immutable Grid history snapshots. Opening a document
  clears history; a new edit after Undo clears the Redo branch.
- `replaceDocumentWithoutHistory` is the boundary for BPM and track Mute/Solo
  changes that must not become Grid history entries. It rebases those non-Grid
  values across existing Undo/Redo snapshots so later Grid history navigation
  cannot roll them back; replacing a different document clears history.
- `src/features/editor/hooks/useRhythmDocumentAutosave.ts` owns the 300ms
  debounce, immediate `flush`, same-document `retry`, and save-status updates.
  A module-wide monotonic revision plus each hook instance's current revision
  prevents older requests—including completions from an unmounted editor—from
  overwriting a newer editor instance's `saving`, `saved`, or `error` state.
- Save failures remain UI state only and never discard or replace the active
  in-memory document. UI document switching must call `flush` before opening
  the next document; that route-level coordination belongs to a later task.

## V0.4.0 Canvas Grid Boundary

- `src/features/editor/domain/rhythmGridGeometry.ts` is the DOM-free geometry
  source for the fixed V0.4.0 grid: 32 CSS pixels per sixteenth Step, 44 per
  track row, 36 for the beat header, eight rows, and 16 Steps per measure.
  Hit testing, cell rectangles, and cursor movement operate only in CSS pixels.
- `src/features/editor/components/RhythmGridCanvas.tsx` draws the header,
  Step/beat/measure hierarchy, cursor, and notes on one Canvas. It receives a
  controlled document/cursor and reports only `trackId + tick` intents; Store
  edits remain the future parent page's responsibility.
- Canvas CSS size and backing size are separate. The backing ratio follows
  device DPR until it reaches a 16384-pixel dimension or 16M-pixel allocation
  budget, preventing a 16-measure Grid from exhausting high-DPR mobile Canvas
  limits while preserving the full CSS coordinate space.
- Canvas sizing/observer work is separate from content redraws. The playhead is
  a 2px pointer-inert DOM overlay, so animation-frame Tick changes move only a
  transform and never reallocate or redraw the full Grid backing buffer.
- Pointer editing captures the active pointer. Movement beyond six CSS pixels
  permanently classifies the gesture as scrolling/dragging until pointer up or
  cancel, so leaving and re-entering the Canvas cannot create a note.
- The Canvas itself is visual-only. Its focusable wrapper exposes `grid`
  semantics, row/column counts, one hidden active `row > gridcell`, and polite
  action announcements. Arrow keys clamp the controlled cursor; Space/Enter
  emit one toggle intent for the normalized active cell.

## V0.4.0 Editor Route and Workbench

- `/editor` is the fourth primary route and `编辑` is the fourth bottom-navigation
  link. `AppLayout` applies `app-shell--editor` only on that route so its content
  is intentionally wider than the V0.3 720px page cap; Timer remains the only
  route without bottom navigation.
- `EditorPage` is the orchestration boundary for the active rhythm document. It
  resolves/restores through `RhythmDocumentRepository`, opens Store state, wires
  autosave, and combines the toolbar, measure controls, fixed track column, and
  visual-only Canvas Grid.
- Every document transition stops future playback, flushes the old document, and
  proceeds only when that save succeeds. Failed flushes leave the in-memory
  document active for retry; successful transitions reset measure/cursor state.
- Leaving Editor triggers an immediate flush. Autosave `flush` and `retry` now
  report boolean success so transition guards can preserve unsaved in-memory
  work without surfacing timer-driven write failures as unhandled rejections.
- `EditorToolbar` owns document-selection and focus-managed rename/delete
  dialogs; `MeasureControls` owns destructive measure confirmations;
  `TrackControlPanel` renders the eight fixed bilingual tracks with 44px
  Mute/Solo controls. None access Dexie directly.
- Mobile preserves a fixed track column and lets only the Grid timeline scroll
  horizontally. Library, score, Count-in, metronome, and audio Transport UI
  remain absent until their dedicated tasks.

## Root Files

- `package.json`: defines app metadata, npm scripts, runtime dependencies, and test/tooling dependencies, including `fake-indexeddb` for Dexie tests.
- `package-lock.json`: locks exact dependency resolution for repeatable installs.
- `.gitignore`: excludes generated artifacts and local noise such as `node_modules/`, `dist/`, `test-results/`, and `.DS_Store`.
- `index.html`: Vite HTML entry that mounts React into `#root`.
- `vite.config.ts`: Vite configuration with React plugin and basic PWA manifest/service-worker generation.
- `.github/workflows/deploy-pages.yml`: GitHub Pages release pipeline. It
  installs locked dependencies, builds with `VITE_BASE_PATH=/SnareLab/`, uploads
  `dist/`, and deploys it through GitHub Actions when `main` changes.
- `public/icons/snarelab-icon.svg`: standalone and maskable SnareLab PWA icon, referenced by the generated web manifest and precached by Workbox.
- `public/icons/snarelab-icon-192.png`: generated standard-resolution SnareLab
  installation icon for PWA launchers.
- `public/icons/snarelab-icon-512.png`: generated high-resolution maskable
  SnareLab installation icon for Android launchers and store-facing PWA use.
- `vitest.config.ts`: Vitest configuration using jsdom, global test APIs, and `tests/setup.ts`.
- `playwright.config.ts`: Playwright configuration for future mobile Chrome UI tests. It builds the app, starts Vite preview on `127.0.0.1:4173`, and looks for `*.e2e.ts` or `*.e2e.tsx` files under `tests/`.
- `tsconfig.json`: TypeScript project reference root.
- `tsconfig.app.json`: strict TypeScript settings for `src/` and test files.
- `tsconfig.node.json`: strict TypeScript settings for Vite, Vitest, and Playwright config files.

## App Files

- `src/main.tsx`: React entry point. It mounts `App` inside `StrictMode` and imports global styles.
- `src/app/App.tsx`: top-level browser-router provider and app route mount
  point. Its Vite `BASE_URL` basename keeps route URLs correct both locally and
  under the GitHub Pages `/SnareLab/` subpath.
- `src/app/router.tsx`: defines the five Task 2 routes, shared layout, unknown-route redirect, temporary route titles, and the rule that Timer has no bottom navigation.
- `src/components/BottomNavigation/BottomNavigation.tsx`: renders the four visible primary navigation links and derives active state from `NavLink`.
- `src/components/BottomNavigation/index.ts`: public export boundary for the bottom-navigation component.
- `src/types/index.ts`: canonical V0.2 domain shapes for sessions, categories, tags, pending drafts, and log filters. It intentionally excludes V0.3 rhythm fields.
- `src/database/dexie.ts`: owns Dexie versions, table declarations, indexes, and the shared production `db` instance.
- `src/database/migrations.ts`: owns the v1-to-v2 backfill of `tagIds`, `updatedAt`, and category `isSystem` values.
- `src/database/seedDefaults.ts`: owns stable default category and preset-tag definitions plus idempotent seed functions.
- `src/repositories/categoryRepository.ts`: creates, edits, lists, and deletes categories; non-system deletion migrates linked sessions to `uncategorized` in one transaction.
- `src/repositories/sessionRepository.ts`: sole access boundary for practice-session creation, metadata-only updates, hard deletion, selected-day queries, and combined filtering.
- `src/repositories/tagRepository.ts`: creates, edits, lists, and deletes tags; deletion removes tag ids from linked sessions in one transaction.
- `src/store/timerStore.ts`: owns in-memory timer status, start/end times, and elapsed duration; running state is intentionally not persisted.
- `src/components/SaveSessionSheet/SaveSessionSheet.tsx`: reusable focus-managed save dialog for finished timer facts and recovered drafts; owns required category, optional tag, and optional note form state while keeping duration read-only.
- `src/components/SaveSessionSheet/index.ts`: public export boundary for the Save Session Sheet.
- `src/services/pendingSessionDraftService.ts`: persists one finished, unsaved draft and restores serialized dates for recovery.
- `src/hooks/useDialogFocus.ts`: reusable dialog focus utility that moves focus into an open sheet, traps Tab/Shift+Tab cycling, and restores prior focus when it closes.
- `src/services/statisticsService.ts`: pure real-time session aggregation for totals, selected period duration, current streak, category distribution, and month heatmap data; it deliberately has no tag aggregation.
- `src/pages/Timer/TimerPage.tsx`: focused Timer route and control coordinator; updates the transient display, restores only explicitly requested finished drafts, loads category/tag choices through repositories, and delegates metadata entry to SaveSessionSheet. Its optional database prop keeps integration tests isolated.
- `src/pages/Today/TodayPage.tsx`: reads today's sessions and classification metadata through repositories, renders resolved record details, and owns the confirmed pending-draft recovery entry point.
- `src/pages/Category/CategoryPage.tsx`: Category & Tags route page; coordinates tab state, classification forms, deletion confirmations, display summaries, and repository-backed refreshes without direct Dexie-table access.
- `src/pages/Statistics/StatisticsPage.tsx`: Statistics route page; reads sessions/categories through repositories, selects a week or month period, renders category-only aggregates, and reuses CalendarHeatMap in summary mode.
- `src/pages/Log/LogPage.tsx`: owns Log route state, month/selected-day state, filter application, and repository-backed record refreshes; it composes the calendar and record sheets without accessing Dexie tables directly.
- `src/components/CalendarHeatMap/CalendarHeatMap.tsx`: reusable monthly intensity grid; `navigation` mode provides accessible date buttons while `summary` mode renders non-interactive trend cells for future Statistics reuse.
- `src/components/CalendarHeatMap/index.ts`: public CalendarHeatMap component and type export boundary.
- `src/components/FilterSheet/FilterSheet.tsx`: local Log filter editor for category, tag, start/end date, and minimum/maximum duration, with apply/reset/close actions.
- `src/components/FilterSheet/index.ts`: public FilterSheet export boundary.
- `src/components/RecordBottomSheet/RecordBottomSheet.tsx`: view/edit/delete-confirmation sheet for one session; it shows immutable timer facts read-only and delegates metadata writes and hard deletion to its parent.
- `src/components/RecordBottomSheet/index.ts`: public RecordBottomSheet export boundary.
- `src/index.css`: global reset, V0.2 color/spacing/radius/type tokens, focus ring, app-shell layout, bottom-navigation states, and reduced-motion override.
- `src/vite-env.d.ts`: Vite client type declarations, including CSS side-effect imports.

## Test Files

- `tests/setup.ts`: shared Vitest setup that loads Testing Library jest-dom matchers and registers fake IndexedDB for route and data tests.
- `tests/README.md`: placeholder explaining that task-specific tests will be added as implementation progresses.
- `src/app/App.test.tsx`: route-title, primary-navigation transition, active-state, and accessible-name tests for Task 2.
- `src/database/database.test.ts`: real IndexedDB/Dexie tests for table initialization, v1-to-v2 migration, idempotent default seeds, and the `Uncategorized` protection rule.
- `src/repositories/sessionRepository.test.ts`: real IndexedDB/Dexie tests for session save, immutable timer facts, hard delete, start-time date queries, and combined filters.
- `src/repositories/categoryTagRepository.test.ts`: real IndexedDB/Dexie tests for category migration and tag cleanup transactions.
- `src/store/timerStore.test.ts`: timer state-transition coverage.
- `src/pages/Timer/TimerPage.test.tsx`: isolated IndexedDB coverage for the required-category Save Session Sheet, optional tag/note fields, and explicit finished-draft recovery.
- `src/services/pendingSessionDraftService.test.ts`: pending-draft save/read/clear coverage.
- `src/components/CalendarHeatMap/CalendarHeatMap.test.tsx`: navigation-date selection and non-interactive summary-mode coverage.
- `src/pages/Log/LogPage.test.tsx`: seeded IndexedDB integration coverage for calendar intensity, selected-day records, combined filters, record view/edit, and confirmed hard deletion.
- `src/pages/Category/CategoryPage.test.tsx`: seeded IndexedDB integration coverage for segmented management views, category/tag create-edit flows, category migration deletion, and tag cleanup deletion.
- `src/services/statisticsService.test.ts`: deterministic total, period, streak, category-distribution, and heatmap aggregation coverage, including tag exclusion.
- `src/pages/Statistics/StatisticsPage.test.tsx`: seeded IndexedDB integration coverage for category-only Statistics content and non-interactive heatmap rendering.
- `src/components/RecordBottomSheet/RecordBottomSheet.accessibility.test.tsx`: verifies the record sheet gives initial keyboard focus to its close control.
- `tests/pwa-assets.test.ts`: verifies the PWA icon asset and caching configuration are declared.
- `tests/app-shell.e2e.ts`: Playwright browser coverage for the five direct routes and four-tab navigation. It requires a locally installed Playwright Chromium executable.

## Expected Future Structure

Follow the V0.2 technical design when adding product code:

- `src/app/`: providers, router, and app shell.
- `src/pages/Today/`, `src/pages/Timer/`, `src/pages/Log/`, `src/pages/Category/`, `src/pages/Statistics/`: route-level screens.
- `src/components/`: reusable UI components such as bottom navigation, sheets, chips, cards, dialogs, and heatmaps.
- `src/database/`: Dexie setup, migrations, and seed data.
- `src/repositories/`: data access for sessions, categories, and tags.
- `src/services/`: statistics, pending draft, and filter logic.
- `src/store/`: Zustand stores.
- `src/types/`: shared domain types.

## V0.3 Direction

### Task 4 Timer and Draft Boundaries

- `src/pages/Timer/TimerPage.tsx` is the V0.3 timer-flow coordinator. It owns
  transient control actions, maintains a memoized finished draft so metadata
  refreshes cannot reset in-progress form choices, and is the only page that
  converts a timer result into a session save or pending draft.
- `src/components/SaveSessionSheet/SaveSessionSheet.tsx` is the single
  metadata entry point for both new and recovered finished sessions. It owns
  local category/tag/note form state and emits complete metadata back to the
  timer page. It renders with `createPortal(..., document.body)` so its
  full-screen backdrop is centered against the viewport rather than a page
  container.
- `src/services/pendingSessionDraftService.ts` persists exactly one V0.3
  pending draft in `pendingDrafts`, including attachment Blobs. Its async API
  requires a `SnareLabDatabase`; it also imports the older localStorage draft
  once for compatibility and then removes that legacy value.
- `src/database/dexie.ts` version 4 declares `pendingDrafts`. Session,
  category, and tag stores keep their V0.3 indexes unchanged; a pending draft
  is separate from a saved `PracticeSession` and must not appear in statistics
  or record lists.
- `src/components/ImageAttachmentGrid/` remains controlled: it never writes
  to Dexie. In Task 4, `TimerPage` compresses selected files, owns attachment
  changes on the active draft, and supplies the grid callbacks.
- `src/index.css` defines bottom sheets against `100dvw`/`100dvh`, with
  internal scrolling and safe-area-aware sticky save actions. Future sheets
  should retain the same viewport behavior.

### Task 5 Today and Recovery Boundaries

- `src/pages/Today/TodayPage.tsx` is the V0.3 Today composition root. It reads
  sessions, categories, tags, and the single pending draft through repositories
  and the pending-draft service, then derives its duration metrics, selected
  month's heatmap, and today's records. It is display-oriented and must not
  write session data directly.
- `src/components/CalendarHeatMap/` is shared calendar presentation. Its
  `weekStartsOnMonday` option lets Today use the requested Monday-first Chinese
  layout without changing the Records or Statistics interpretation of existing
  calendars.
- `src/pages/Timer/TimerPage.tsx` converts a `PendingSessionDraft` to an input
  for `SessionRepository.saveSession` by explicitly dropping the draft `id` and
  draft creation metadata. Pending records and completed sessions therefore
  never share identity, even when saving a recovered draft.
- `src/components/SaveSessionSheet/SaveSessionSheet.tsx` receives `isSaving`
  and `saveError` as controlled feedback from the page. It blocks duplicate
  actions during a write and exposes a Chinese error alert on failure; it still
  owns only temporary form state.

### Task 6 Records Boundaries

- `src/pages/Log/LogPage.tsx` remains the route implementation for `/records`.
  It reads records through `SessionRepository.filterSessions`, groups them by
  local `startTime` date in descending order, owns only category/tag filter
  state, and opens the existing `RecordBottomSheet` from a card selection.
- `LogPage` deliberately does not use `CalendarHeatMap` as a page body or keep
  selected-day state. The V0.3 records timeline is a compact browsing view:
  date nodes and time nodes provide order, while the cards hold the record
  summary. The timeline's indigo is reserved for start-time scanning; weekday
  labels remain secondary text.
- `src/components/FilterSheet/FilterSheet.tsx` is now the shared V0.3
  classification filter surface. Its public UI accepts only category and tag
  selections, although `LogFilter` and `SessionRepository.filterSessions`
  retain date/duration fields for backward-compatible repository queries.
- `src/utils/classificationLabels.ts` translates system category and preset tag
  identifiers into the approved Chinese UI names. Pages and sheets should reuse
  it instead of adding duplicate id-to-label maps.

- V0.3 redesigns the product around three primary routes: Today, Records, and
  Statistics. Classification management is no longer a primary navigation
  destination; it is reached from the global settings icon and via contextual
  save/edit shortcuts.
- The V0.3 Today page intentionally preserves V0.2's compact split-metric and
  record-card information density. Its visible English exceptions are the page
  title (`Today`) and short date (`Jul 12`); all other interface copy is
  Chinese. Its compact heatmap is paired with month-to-date days and duration,
  and today's records always flow below it without an expansion control.
- Today duration metrics are separate sibling cards, not a compound split card.
  The calendar panel owns month labeling and navigation; its adjacent summary
  uses the same bordered surface language to show monthly days and duration.
- The Records route is a date-grouped list, not a continuous visual timeline:
  group titles separate dates, while record cards have no adjacent vertical
  guide or date-node decoration.
- Record details remain Bottom Sheets. V0.3 extends the existing metadata model
  with local image attachments while preserving immutable timer facts.
- The V0.3 prototype is intentionally self-contained and simulates local UI
  state in its embedded script. It is a review artifact, not the production
  implementation; its timer, save, image, detail, statistics, and settings
  transitions are nevertheless browser-verified as a coherent user journey.
- V0.3 statistics introduce synchronized month/year views, category duration
  distribution, and tag-usage distribution. Tags remain a many-to-many label,
  so their chart measures usage count rather than duration share.
- In the V0.3 prototype, the Statistics month heatmap owns its calendar
  framing: it shows the full natural month, weekday labels, and month controls.
  Both distribution cards use the same vertical composition: centered donut
  total, followed by a color-keyed item row with its quantity, percentage, and
  proportional progress bar.
- The Statistics period control changes the heatmap composition as well as the
  label: month shows one complete month; year shows a 3-column grid of twelve
  miniature month calendars and an intensity legend. Do not reuse the monthly
  date grid as the annual visual.

## Architectural Constraints

- Pages must not access Dexie directly; database writes go through repositories.
- Aggregation logic belongs in services or repositories, not UI components.

## V0.3 Attachment Foundation

- `src/types/index.ts` defines `ImageAttachment` as the shared local-image
  value object. It contains the compressed Blob plus its metadata and display
  order; no remote URL or server identifier belongs in this model.
- `PracticeSession.attachments` and `PendingSessionDraft.attachments` are
  required arrays. New sessions receive an empty array, and consumers must not
  use an absent-field check as a feature flag.
- `src/database/dexie.ts` owns database version 3; `migrateV2ToV3` in
  `src/database/migrations.ts` is the only migration path that backfills empty
  attachment arrays for persisted V0.2 sessions. The schema intentionally does
  not index image blobs.
- `SessionRepository.saveSession` accepts optional attachments and normalizes
  omitted input to an empty array. Attachment validation, Blob compression,
  editing, and draft persistence are deliberately outside this foundation and
  will be added in later V0.3 tasks.

## V0.3 Shell and Navigation

- `src/app/router.tsx` owns the V0.3 primary route contract: `/`, `/timer`,
  `/records`, and `/statistics`. `/log` is an explicit compatibility redirect
  to `/records`; `/category` is no longer a destination in the product IA.
- `src/app/AppShellContext.tsx` provides the global `openSettings` action.
  `AppLayout` owns SettingsPanel state, so primary pages can open it without
  each page duplicating overlay state.
- `src/components/AppHeader/` renders the common SnareLab identity, page title,
  optional trailing control, and settings icon. `src/assets/snarelab-mark.svg`
  is the canonical vector mark; it is displayed at 30px beside the small
  indigo SnareLab wordmark.
- `src/components/SettingsPanel/` owns settings presentation, focus management,
  and close behavior. Task 8 will wire its category and tag entries to actual
  management flows.
- `src/components/BottomNavigation/` contains exactly three V0.3 links. The
  Timer route is the sole route that hides bottom navigation.

## V0.3 Settings Classification Management

- `src/app/AppShellContext.tsx` exposes `openSettings` and the monotonic
  `classificationRevision` signal. `AppLayout` owns both the Settings panel
  and the active management kind; a successful repository operation increments
  the revision so mounted pages reload their classification data.
- `src/components/SettingsPanel/` is deliberately small. It only opens
  category or tag management and exposes a disabled theme row. It must not
  duplicate management state, repository reads, or form logic.
- `src/components/ClassificationManagementSheet/` is the shared full-screen
  management surface, despite its historical filename. It owns search, local
  ordering, item action menus, create/edit form state, deletion confirmation,
  and per-item usage statistics. It depends on repositories for persistence;
  it never mutates session records directly.
- `ClassificationManagementSheet` calls `ensureDefaultCategories` and
  `ensurePresetTags` before listing items, then reads categories, tags, and
  sessions through their repositories. Its category deletion path delegates to
  `CategoryRepository.deleteCategory`; its tag deletion path delegates to
  `TagRepository.deleteTag`, preserving the repository transaction rules.
- `src/utils/classificationLabels.ts` translates only untouched seeded names.
  Once a default category or tag has been renamed, it returns the persisted
  name, preventing the UI translation layer from hiding management changes.
- `src/database/seedDefaults.ts` identifies preset tags by immutable `id`, not
  mutable `name`. This preserves user edits while retaining idempotent default
  seeding.
- `TodayPage`, `TimerPage`, `LogPage`, and `StatisticsPage` subscribe to
  `classificationRevision`. Their own page state remains local, but their
  repository reads are refreshed after management changes so selectors,
  filters, records, and reports stay synchronized.

## V0.3 Image Attachments

- `src/services/imageAttachmentService.ts` is the sole browser-side boundary
  for preparing image files. It owns MIME validation, Canvas-based JPEG
  compression, the 2MB output cap, and the six-image per-record limit.
- `compressImageAttachment` returns a fully populated `ImageAttachment`; it
  does not write to Dexie or mutate record state. Callers must validate total
  capacity before accepting multiple files.
- `removeAttachment` and `moveAttachment` are pure helpers. They always return
  a new attachment array with sequential `sortOrder` values and can be shared
  by saving and editing views.
- `src/components/ImageAttachmentGrid/` is a presentational controlled
  component. Parents own attachment state and persistence through its add and
  remove callbacks; the component owns only fixed-grid rendering, input access,
  preview object URLs, and local feedback display.

## V0.3 Record Detail Boundaries

- `src/components/RecordBottomSheet/` is the only record-detail surface. It
  owns view, edit, and delete-confirmation states; the parent controls whether
  the selected session is open and reloads its lists after repository writes.
- `RecordBottomSheet` keeps `duration`, `startTime`, and `endTime` read-only.
  It renders the two timestamps as one compact practice-time range and sends
  only category, tags, note, and attachments to its save callback.
- `SessionRepository.updateSessionMetadata` is the persistence boundary for
  record editing. Its metadata update now includes the complete normalized
  attachment array, but it still never writes timer facts.
- `src/components/CategoryPicker/` is the shared custom category listbox for
  `SaveSessionSheet` and `RecordBottomSheet`. It owns opening and closing the
  options list; parents own the selected category id and any persistence.
- `ImageAttachmentGrid` remains controlled by its parent and now exposes
  optional accessible move callbacks for attachment ordering. Ordering itself
  is normalized by `moveAttachment` in `imageAttachmentService`.
- `SnareLabDatabase` is the only place that defines IndexedDB versions and table indexes; migrations are kept separate so schema evolution remains reviewable.
- `ensureDefaultCategories` and `ensurePresetTags` are safe to call more than once. `uncategorized` is the stable system-category id used by future migration logic.
- Default categories and preset tags are data definitions, not UI constants; future views must read them through repositories or stores.
- Category deletion rejects system categories and migrates linked sessions to `uncategorized` before removing a non-system category.
- Tag deletion preserves sessions and removes the deleted tag id from their `tagIds` arrays.
- Timer state is transient. Only a finished unsaved draft is recoverable; saving a session clears that draft.
- Timer elapsed time is accumulated only while running. Pause stores the completed running segment, resume starts a new segment, and finished facts exclude paused time.
- SaveSessionSheet is the shared boundary for both newly finished timers and recovered drafts; category is required, tags/note are optional, and duration is never editable.
- `SessionRepository` owns all direct session-table access. A save requires an existing category; metadata updates do not write duration or timestamps; deletion is hard deletion.
- Practice-date queries use the local calendar day of `startTime`, including a full end day for date ranges. Combined filtering uses AND across category, tag, date, and duration dimensions; a session matches the tag dimension when it contains any selected tag.
- `App` owns browser-router setup; `router.tsx` owns route composition and shell-level route rules; `BottomNavigation` owns only primary navigation presentation.
- The four primary routes are Today, Log, Category, and Statistics. Timer remains routable at `/timer` but is intentionally excluded from the bottom-navigation set.
- Route placeholders must be replaced by route-level page modules in their matching future tasks, without changing the public paths or navigation labels.
- Timer facts are immutable after save; later record edits only change category, tags, and note.
- Statistics stay category-focused in v0.2 and must not include tags.
- `statisticsService` owns statistics aggregation; it operates only on session facts and category ids, so tag ids cannot affect V0.2 statistics.
- Running timer state is not restored after refresh; only finished unsaved drafts are recoverable.
- PWA navigation uses Workbox's `index.html` fallback, and its manifest icon is cacheable offline; browser sheets use `useDialogFocus` for keyboard containment.
- Deployment is GitHub Pages at `https://jellyfive.github.io/SnareLab/`. The
  configurable Vite base path is the shared source for page assets, React
  Router, PWA icon/start URL, and Workbox fallback, preventing subpath drift.
- The PWA manifest declares raster 192px and 512px installation icons in
  addition to the SVG fallback. This provides reliable browser-installable app
  icons without changing the web application's local-first data model.

## V0.3 Statistics Aggregation

- `src/services/statisticsService.ts` is the sole domain aggregation boundary
  for the V0.3 statistics experience. It receives persisted `PracticeSession`
  facts and returns display-ready summaries; pages must not independently
  calculate durations, ratios, streaks, or heatmap data.
- `StatisticsPeriod` supports `month` and `year` for V0.3. The legacy `week`
  member exists only until Task 10 replaces the older statistics page controls.
  Every period is calculated with local `startTime` calendar boundaries and
  excludes future days after the supplied `now` value.
- `StatisticsResult.todayDuration` is always the current local day;
  `totalDuration` and `sessionCount` are all-time; `periodDuration`, `heatmap`,
  category distribution, and tag distribution are scoped to the selected
  period. `currentStreak` remains an all-session, local-day calculation.
- `categoryDistribution` and `tagDistribution` are both duration-based. A
  multi-tag session contributes its full duration to every attached tag, so tag
  percentages may total more than 100% and must not be combined with category
  percentages.
- Percentage allocation uses the largest-remainder method so a non-empty chart
  always displays a total of exactly 100%; empty and zero-value inputs return
  empty distributions or zero percentages without division errors.

## V0.3 Statistics Overview Drilldown

- `src/pages/Statistics/StatisticsPage.tsx` is the route-level coordinator
  for the three overview states: annual overview, month detail, and day
  detail. It loads sessions and classifications through repositories, but all
  aggregation remains in `statisticsService`.
- `src/components/AnnualHeatMap/` renders the year-specific twelve-month grid
  with intensity text equivalents. It is not reused as a monthly calendar.
- `src/components/CalendarHeatMap/` remains the full natural-month component;
  navigation mode exposes each day as an accessible date button for the month
  to day-detail transition.
- `calculateMonthSummaries` owns the twelve monthly totals. Completed months
  include their full natural range, while the active month stops at the local
  current day. `calculateDayStatistics` owns one-day duration, count,
  chronological record ordering, and category duration distribution.
- The Statistics day-detail reuses `RecordBottomSheet` for record viewing and
  metadata editing. This preserves the global constraint that there is exactly
  one record-detail implementation and that timer facts are immutable.
- Detail navigation has explicit hierarchy: day returns to its parent month;
  month returns to the annual overview. The Category and Tag views are the
  next independent Task 10.2 surface.

## V0.3 Annual Statistics Presentation

- `src/components/AnnualHeatMap/AnnualHeatMap.tsx` renders the annual view as
  a Monday-first, 53-column calendar. It owns only week/date placement and
  intensity mapping; it does not perform session aggregation or navigation.
- `src/pages/Statistics/StatisticsPage.tsx` composes annual metrics, the
  annual heatmap, and month-summary entry points. It uses the statistics
  service output for all numeric values and owns only selected-view state.
- The annual month-summary strip is intentionally presentational. It condenses
  already-aggregated daily heatmap durations into sixteen cells and remains
  inside `StatisticsPage` because it is specific to this annual list.
- `src/index.css` contains the responsive visual vocabulary for the annual
  screen. The 53-column grid is constrained within the page surface so the
  dashboard remains usable at phone widths without horizontal scrolling.

## V0.3 Monthly Statistics Presentation

- `src/services/statisticsService.ts` exposes `listMonthPracticeSessions` for
  reverse-chronological, period-bounded month records. It reuses the same local
  calendar boundary rules as the heatmap and remains the only source of this
  list's period filtering.
- `src/components/CalendarHeatMap/CalendarHeatMap.tsx` supports an opt-in
  `showDuration` display mode. The navigation semantics stay unchanged: the
  parent still owns date selection, while the component only adds a compact,
  Chinese duration label when data exists for a day.
- `src/components/DistributionDonut/DistributionDonut.tsx` supports a compact
  side-by-side presentation for the monthly category distribution without
  affecting the vertical card used by other statistics views.
- `src/components/AppHeader/AppHeader.tsx` supports a centered detail title
  with a balanced leading action. Month drilldown uses it for the centered
  month selector while the page still owns navigation state.
- `src/pages/Statistics/StatisticsPage.tsx` composes the monthly heatmap,
  category distribution, and recent records. It does not calculate period
  totals or filter raw sessions directly.

## V0.3 Final Acceptance Surface

- The application remains local-first: `SnareLabDatabase` persists sessions,
  category/tag metadata, image Blobs, and completed unsaved drafts in
  IndexedDB. The application shell reloads these repositories on route and
  classification changes, so statistics and selectors refresh from persisted
  facts rather than in-memory copies.
- `StatisticsPage` now presents one shared hierarchy for annual, month, and
  day drilldowns. The detail header is centered through `AppHeader`; day detail
  uses the same `RecordBottomSheet` as Log and supplements its record list with
  a duration-based category donut.
- The final PWA configuration in `vite.config.ts` uses a single configurable
  base path for routes, manifest assets, start URL, and Workbox fallback. The
  GitHub Pages workflow builds with `/SnareLab/`, preserving installation and
  offline shell behavior under the repository subpath.

## V0.4.0 Editor Transport Lifecycle

- `useEditorAudio` owns the React lifecycle around `RhythmAudioEngine`: one
  engine per editor mount, subscriptions, visibility/unmount cleanup, visible
  error state, and rAF-only playhead presentation. Canvas receives only Tick.
- `TransportControls` is controlled; EditorPage applies BPM and Mute/Solo as
  non-history document changes, preserves autosave, and updates audio at once.

## V0.4.0 Local Drum Samples and Audio Engine

- `public/audio/drum-kit/` contains the eight normalized offline WAV assets.
  `LICENSE.md` records the creator/source URL, CC0 1.0 licence, retrieval date,
  modification status, and exact filename mapping; future audio assets require
  equivalent provenance.
- `src/features/editor/audio/sampleManifest.ts` is the stable base-path-safe
  `RhythmTrackId` map. Components must not hard-code sample URLs.
- `RhythmAudioEngine` owns AudioContext creation, decoded-buffer caching, source
  nodes, master gain, transport state, and precise scheduling. It is React-free
  and has injected context/fetch/interval dependencies for deterministic tests.
- The scheduler wakes every 25ms while `AudioContext.currentTime` controls onset;
  it schedules 100ms ahead in tick then track order, applies velocity gain, and
  reads fresh Mute/Solo state for only newly scheduled notes. Errors—including
  unsupported Web Audio—remain explicit audio state and never affect document
  editing or persistence. Workbox includes WAV assets in PWA precaching.
