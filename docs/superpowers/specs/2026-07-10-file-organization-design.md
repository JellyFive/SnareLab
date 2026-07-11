# SnareLab File Organization Design

## Goal

Make the repository easy to navigate before Task 2 without changing the
approved V0.2 scope, deleting historical material, or moving the already
validated Task 1 application scaffold.

## Source-of-Truth Layout

```text
SnareLab/
  docs/
    V0.0/                         # Historical design exploration
    V0.1/                         # Frozen predecessor specifications
    V0.2/                         # Current product source of truth
      prototypes/                 # Migrated V0.3 visual reference
      implementation-plan.md      # Approved task sequence
    superpowers/specs/            # Architecture and file-organization decisions
  memory-bank/
    arch.md                       # Current architecture and file ownership
    process.md                    # Verified task history and handoff notes
  src/
    app/                          # Bootstrap, providers, router, app shell
    components/                   # Shared presentation components
    pages/                        # Route-level screens
    database/                     # Dexie database and seed/migration logic
    repositories/                 # Persistent entity access
    services/                     # Derived domain behavior
    store/                        # Zustand UI/session state
    types/                        # Shared domain models
  tests/
    unit/                         # Isolated logic tests
    integration/                  # Repository and store integration tests
    e2e/                          # Playwright browser tests
```

Directories under `src/` that are not needed by Task 2 remain absent until the
matching implementation-plan task creates them. This prevents empty folders
from masquerading as implemented architecture.

## Documentation Roles

- `docs/V0.2/` remains the authoritative product, technical, and UI contract.
- `docs/V0.2/prototypes/snarelab-v0.3-rhythm-practice-prototype.*` remains a
  future-facing visual reference only; its BPM, time-signature, target, and
  rhythm-specific features are not V0.2 requirements.
- `memory-bank/arch.md` explains the repository as it exists now.
- `memory-bank/process.md` records only work that was implemented and verified.
- A root `README.md` will provide the single entry point for running, testing,
  and locating the current documentation.
- `AGENTS.md` will state the real scaffold, commands, paths, and contribution
  boundaries, while retaining the user-defined supplementary protocols.

## Changes to Apply

1. Add `README.md` with the project purpose, standard npm commands, and a map
   of the authoritative V0.2 documents.
2. Update `AGENTS.md` so it reflects the current source tree and Vite/Vitest/
   Playwright scripts, and correct the obsolete `docs/V0.3/prototypes/` path.
3. Update `memory-bank/arch.md` with the agreed directory ownership and the
   staged creation rule for future `src/` and `tests/` directories.
4. Add empty test-layer directories only when their corresponding tests are
   introduced. Do not add placeholder source directories.
5. Remove the obsolete `docs/V0.3/` directory after confirming that it contains
   only ignored operating-system metadata; the migrated prototype remains in
   `docs/V0.2/prototypes/`.
6. Preserve all existing document and prototype filenames and paths, except for
   correcting references that incorrectly point to the obsolete V0.3 folder.

## Verification

- List `docs/`, `memory-bank/`, `src/`, and `tests/`; each present path must
  match this design or be an intentionally deferred directory.
- Search application and project-guidance files for the obsolete V0.3 prototype
  path; there must be no stale references after the cleanup.
- Run `npm run typecheck`, `npm test`, and `npm run build`; documentation and
  directory cleanup must not alter the validated Task 1 application behavior.
- Confirm `README.md`, `AGENTS.md`, and `memory-bank/arch.md` agree on the
  same source-of-truth paths and commands.

## Non-Goals

- Do not begin Task 2 or change application behavior.
- Do not relocate V0.0 or V0.1 historical material.
- Do not implement V0.3 rhythm-practice features.
- Do not change the V0.2 product, technical, UI, or implementation-plan scope.
