# Tasks: UX Polish Batch

**Created**: 2026-04-03
**Plan**: [impl-plan.md](./impl-plan.md)
**Spec**: [spec.md](./spec.md)

## Phase 1: Core Element Shape Type (US-1, Slices 1+2)

**Goal**: Change all core element shapes from ROUNDED_RECTANGLE to SQUARE so they maintain sharp corners on resize.

- [ ] T001 [P] [US1] Change shape type to SQUARE and remove cornerRadius for create-command, create-event, create-query, create-actor handlers — TDD: update tests in `src/features/create-command/handlers.test.ts`, `src/features/create-event/handlers.test.ts`, `src/features/create-query/handlers.test.ts`, `src/features/create-actor/handlers.test.ts` to assert `shapeType = 'SQUARE'` and remove cornerRadius assertions first, then update `src/features/create-command/handlers.ts`, `src/features/create-event/handlers.ts`, `src/features/create-query/handlers.ts`, `src/features/create-actor/handlers.ts` (change `'ROUNDED_RECTANGLE'` → `'SQUARE'`, remove `*_CORNER_RADIUS` constants and `cornerRadius` lines)

- [ ] T002 [P] [US1] Change shape type to SQUARE in YAML import handler — TDD: update tests in `src/features/import-from-yaml/handlers.test.ts` to assert SQUARE shape type, then update `src/features/import-from-yaml/handlers.ts` (remove `ELEMENT_CORNER_RADIUS` constant, change all 4 `shapeType = 'ROUNDED_RECTANGLE'` → `'SQUARE'` in commands/events/queries/GWT item creation blocks, remove all `cornerRadius` lines)

## Phase 2: Positioning Fixes (US-2, US-3, Slices 3+4)

**Goal**: Fix vertical spacing in imported slices and issue link marker visibility.

- [ ] T003 [P] [US2] Increase RESERVED_TOP_SPACE from 240 to 400 in `src/features/import-from-yaml/handlers.ts` — TDD: update any Y-position assertions in `src/features/import-from-yaml/handlers.test.ts` first, then change `const RESERVED_TOP_SPACE = 240` → `const RESERVED_TOP_SPACE = 400`

- [ ] T004 [P] [US3] Fix issue link marker Y position from 8 to 40 in `src/features/update-slice-issue-url/handlers.ts` — TDD: update marker position assertion in `src/features/update-slice-issue-url/handlers.test.ts` to expect `y = 40`, then change `marker.y = 8` → `marker.y = 40` (keep `marker.x = 8` unchanged, do NOT reposition existing markers on URL update)

## Phase 3: Import UI Restructuring (US-4, US-5, Slice 5)

**Goal**: Move YAML import from settings to main panel with collapsible "Other" section and inline error display.

- [ ] T005 [US4][US5] Move import to main panel and add inline error display — TDD: first remove `'Import YAML in Settings Panel'` describe block from `src/features/open-plugin-panel/SettingsPanel.test.tsx` and add new tests for main panel import (collapsed "Other" section by default, expanding shows textarea, import sends message, error displays inline on `import-from-yaml-error` message, error clears on textarea edit, error clears on successful import, import button disabled when empty). Then implement in `src/features/open-plugin-panel/Panel.tsx`: (1) add import state (`importYaml`, `importError`, `templateCopied`), (2) add `import-from-yaml-error` listener in `handleMessage`, (3) add collapsible "Other" section after Sections ButtonGroup and before ElementEditor with import textarea + button + inline error, collapsed by default, (4) remove import UI from SettingsPanel component, (5) add `.import-error` styles in `src/shared/styles/global.css` (red text, light red background)

## Dependencies

```
T001 ──┐
T002 ──┤
T003 ──┼── All independent, can run in parallel
T004 ──┤
T005 ──┘
```

All 5 tasks are independent — no task depends on another. T001-T004 are small changes; T005 is the largest.

## Parallel Execution

All tasks can be executed in parallel since they modify different files:
- T001: create-command/event/query/actor handlers
- T002: import-from-yaml handlers (shape type only)
- T003: import-from-yaml handlers (RESERVED_TOP_SPACE only — no conflict with T002 if combined)
- T004: update-slice-issue-url handlers
- T005: Panel.tsx, SettingsPanel.test.tsx, global.css

**Note**: T002 and T003 both modify `src/features/import-from-yaml/handlers.ts`. If running in parallel, merge carefully. If running sequentially, do T002 then T003.

## Verification

```bash
npm run test:run      # All tests pass
npm run build         # Build succeeds
```

## Implementation Strategy

- **MVP**: All 5 tasks constitute the full scope — no phasing needed since each is small
- **Recommended order** (if sequential): T001 → T002 → T003 → T004 → T005
- **TDD workflow per task**: Write/update failing tests first, then implement to make them pass
