# Tasks: Plugin UX Enhancements

**Feature**: Plugin UX Enhancements (FR-1 through FR-4)
**Spec**: [spec.md](./spec.md)
**Plan**: [implementation-plan.md](./implementation-plan.md)
**Approach**: TDD (tests first), logical grouping, sequential execution

---

## Phase 1: Setup

- [ ] T001 Create `src/features/connect-elements/SPEC.md` with acceptance criteria from spec.md FR-3
- [ ] T002 Create `src/features/copy-element-to-yaml/SPEC.md` with acceptance criteria from spec.md FR-4

---

## Phase 2: US-1 — Taller Plugin Panel (FR-1)

**Goal**: Plugin panel opens at 80% of viewport height, clamped to [400, 1100]px.
**Test criteria**: Panel height = clamp(round(viewport.bounds.height × 0.8), 400, 1100); width stays 300px.

- [ ] T003 [US1] Write tests for height calculation: verify 720 for bounds.height=900, 1100 for bounds.height=2000, 400 for bounds.height=400, width stays 300 — in `src/features/open-plugin-panel/init.test.ts`
- [ ] T004 [US1] Implement viewport-based height in `initializePlugin()`: read `figma.viewport.bounds.height`, compute `Math.round(h * 0.8)`, clamp to [400, 1100], pass to `figma.showUI()` — in `src/features/open-plugin-panel/init.ts`

---

## Phase 3: US-2 — Simple Screen Element (FR-2)

**Goal**: Screen element created as single ShapeWithText node instead of group.
**Test criteria**: `createShapeWithText()` called, shape is 200×160, gray fill, corner radius 4, plugin data set on shape directly.

- [ ] T005 [US2] Write tests for ShapeWithText screen creation: verify shape type SQUARE, size 200×160, gray fill, cornerRadius 4, text "Screen", plugin data type/label set — in `src/features/create-screen/handlers.test.ts`
- [ ] T006 [US2] Rewrite screen creation to use `figma.createShapeWithText()` with SQUARE type, remove group/SVG/text node creation — in `src/features/create-screen/handlers.ts`
- [ ] T007 [US2] Review and update paste-handler for new ShapeWithText node type (image paste detection may reference group structure) — in `src/features/create-screen/paste-handler.ts` and `src/features/create-screen/paste-handler.test.ts`

---

## Phase 4: US-3 — Quick Element Connection (FR-3)

**Goal**: Connect button for exactly 2 selected elements, creates curved black connector.
**Test criteria**: Selection count in payload; handler creates connector with correct endpoints, CURVE type, black stroke; button shown only when count===2.

### Sandbox: Selection Count

- [ ] T008 [US3] Write tests for `count` field in multi-select payload: verify count matches selection.length when multiple selected — in `src/features/view-selected-element/handlers.test.ts`
- [ ] T009 [US3] Add `count: selection.length` to multi-select `selection-changed` message payload — in `src/features/view-selected-element/handlers.ts`

### Sandbox: Connect Handler

- [ ] T010 [US3] Write tests for `handleConnectElements`: verify connector created with correct start/end node IDs, CURVE line type, black stroke; verify error when selection !== 2 — in `src/features/connect-elements/handlers.test.ts`
- [ ] T011 [US3] Implement `handleConnectElements` handler and export from `sandbox.ts`; register handler in `src/main.ts` — in `src/features/connect-elements/handlers.ts`, `src/features/connect-elements/sandbox.ts`, `src/main.ts`

### UI: Connect Button

- [ ] T012 [US3] Write tests for Connect button: visible when `multipleSelected && count===2`, hidden when count!==2, sends `connect-elements` message on click — in `src/features/view-selected-element/ElementEditor.test.tsx`
- [ ] T013 [US3] Add Connect button to `ElementEditor` when multipleSelected and count===2; pass `selectionCount` from Panel.tsx — in `src/features/view-selected-element/ElementEditor.tsx`, `src/features/open-plugin-panel/Panel.tsx`

---

## Phase 5: US-4 — Copy Any Element to YAML (FR-4)

**Goal**: Copy to YAML button for core shapes and GWT sections, flat YAML format to clipboard.
**Test criteria**: Handler produces correct YAML for command/event/query/actor/gwt; external flag on external events; fields omitted when empty; clipboard copy + toast.

### Sandbox: Copy Handler

- [ ] T014 [US4] Write tests for `handleCopyElementToYaml`: core shape YAML (name, type, fields, notes, external); GWT YAML with given/when/then arrays; fields omitted when empty; external flag — in `src/features/copy-element-to-yaml/handlers.test.ts`
- [ ] T015 [US4] Implement `handleCopyElementToYaml` handler using `js-yaml`, export from `sandbox.ts`; register handler in `src/main.ts` — in `src/features/copy-element-to-yaml/handlers.ts`, `src/features/copy-element-to-yaml/sandbox.ts`, `src/main.ts`

### UI: Copy to YAML Button

- [ ] T016 [US4] Write tests for Copy to YAML button: shown for command/event/query/actor/gwt; hidden for lane/chapter/processor/screen; sends `copy-element-to-yaml` message with element ID — in `src/features/view-selected-element/ElementEditor.test.tsx`
- [ ] T017 [US4] Add "Copy to YAML" button to `ElementEditor` for eligible types; handle `copy-element-to-yaml-result` message in `Panel.tsx` with clipboard copy and toast — in `src/features/view-selected-element/ElementEditor.tsx`, `src/features/open-plugin-panel/Panel.tsx`

---

## Phase 6: Polish & Cross-Cutting

- [ ] T018 Update Feature Index in `docs/spec.md` with rows for F16.1 TallerPluginPanel, F16.2 SimpleScreenElement, F16.3 ConnectElements, F16.4 CopyElementToYaml — all marked Done
- [ ] T019 Run full test suite (`npm run test:run`) and build (`npm run build`) to verify no regressions

---

## Dependencies

```
Phase 1 (Setup) ──► Phase 2 (US-1) ──► Phase 3 (US-2) ──► Phase 4 (US-3) ──► Phase 5 (US-4) ──► Phase 6 (Polish)
```

- **US-1** and **US-2** are fully independent (no shared files) but executed sequentially per user preference
- **US-3** modifies `view-selected-element` and `Panel.tsx` — must complete before US-4
- **US-4** also modifies `ElementEditor.tsx` and `Panel.tsx` — builds on US-3's changes

## Implementation Strategy

- **MVP**: US-1 (Panel Height) — smallest slice, immediate user-visible improvement
- **Incremental delivery**: Each phase is independently testable and deployable
- **TDD flow**: For each logical group, write tests first (verify they fail), then implement (verify they pass)
- **Sequential execution**: Avoids merge conflicts in shared files (ElementEditor, Panel, main.ts)
