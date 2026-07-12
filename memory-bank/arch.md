# Architecture Notes

## Current Stage

The repository now contains the SnareLab Practice Log v0.2 shell, local data
foundation, Timer/Today flows, Task 8's complete Log flow, and Task 9's
classification-management flow, Task 10's real-time statistics flow, and Task
11's PWA/accessibility hardening. Task 1
established tooling and PWA foundations; Tasks 2-5 added routes, navigation,
domain storage, and repository rules; Tasks 6-7 added Timer and Today behavior;
Task 8 adds calendar-first review, filtering, record metadata editing, and
confirmed hard deletion; Task 9 adds category/tag create, edit, and confirmed
deletion interfaces; Task 10 adds category-only statistics and the shared
summary heatmap; Task 11 completes PWA assets/caching, dialog focus handling,
and automated browser regression.

## Source of Truth

- `docs/V0.2/SnareLab_Practice_Log_v0.2_Product_Spec.md`: product scope, frozen decisions, user flows, and non-goals.
- `docs/V0.2/SnareLab_Practice_Log_v0.2_Technical_Design.md`: target stack, data model, repositories, services, state boundaries, and testing strategy.
- `docs/V0.2/SnareLab_Practice_Log_v0.2_UI_Spec.md`: visual tokens, navigation, page layout rules, accessibility, and motion guidance.
- `docs/V0.2/implementation-plan.md`: task-by-task execution plan. Work should continue one task at a time.
- `docs/V0.2/prototypes/snarelab-v0.3-rhythm-practice-prototype.*`: migrated future-facing visual reference only. Do not implement BPM, time signature, practice target, rhythm notes, or rhythm statistics in v0.2.

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

## Architectural Constraints

- Pages must not access Dexie directly; database writes go through repositories.
- Aggregation logic belongs in services or repositories, not UI components.
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
