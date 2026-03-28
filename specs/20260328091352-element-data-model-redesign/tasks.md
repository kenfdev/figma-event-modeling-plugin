# Tasks: Element Data Model Redesign

**Spec**: [spec.md](spec.md)
**Plan**: [impl-plan.md](impl-plan.md)
**Data Model**: [data-model.md](data-model.md)
**Contracts**: [contracts/messages.md](contracts/messages.md)

## Phase 1: Remove Dead Code (FR-3 + FR-4)

**Goal**: Remove toggle-fields-visibility and detect-drift features entirely. No test tasks needed — just delete code and verify clean build.

- [ ] T001 Remove `toggle-fields-visibility` feature: delete `src/features/toggle-fields-visibility/` directory entirely
- [ ] T002 Remove `toggle-fields-visibility` import and handler registration from `src/main.ts`
- [ ] T003 Remove `fieldsVisible` state, `handleFieldsVisibilityToggle` function, and "Show Fields" checkbox JSX from `src/features/view-selected-element/ElementEditor.tsx`; remove `fieldsVisible` from `SelectedElement` interface
- [ ] T004 Remove `fieldsVisible` from `handleSelectionChange` payload in `src/features/view-selected-element/handlers.ts`
- [ ] T005 Remove i18n key `editor.showFields` from translation files
- [ ] T006 Remove `detect-drift` feature: delete `src/features/detect-drift/` directory entirely
- [ ] T007 Remove `detect-drift` import, handler registration, and `selectionchange` hook calling `handleSelectionForDrift` from `src/main.ts`
- [ ] T008 Remove `driftDetected` state, `drift-detected` message handler from `src/features/open-plugin-panel/Panel.tsx`; remove `driftDetected` prop from `<ElementEditor>` call
- [ ] T009 Remove `driftDetected` prop from `ElementEditorProps`, `handleSyncDrift` function, and sync drift button JSX from `src/features/view-selected-element/ElementEditor.tsx`
- [ ] T010 Remove i18n key `buttons.syncDrift` from translation files
- [ ] T011 Clean up any remaining references to `fieldsVisible`, `originalStrokeR/G/B`, `drift-detected`, `sync-drift` across the codebase
- [ ] T012 Run `npm run test:run` to verify no broken imports or references; fix any failures
- [ ] T013 Update `docs/spec.md`: mark F3.5 ToggleFieldsVisibility and F13.2 DetectDrift as removed in the Feature Index table

## Phase 2: Canvas Text Sync (FR-1) — US-1: Reliable Element Names

**Goal**: Canvas text becomes the source of truth for element names. When a core element is selected, plugin data `label` syncs from canvas text.

**Independent test criteria**: Selecting a core element reads canvas text and updates plugin data label; panel shows canvas text as name.

### Tests

- [ ] T014 [US1] Write tests for canvas text sync in `src/features/view-selected-element/handlers.test.ts`: core element selected → `label` plugin data updated from `text.characters`; canvas text differs from plugin data → plugin data overwritten; canvas text matches → no write; non-core elements not synced; `selection-changed` payload uses canvas text as `name`

### Implementation

- [ ] T015 [US1] Implement canvas text sync in `handleSelectionChange` in `src/features/view-selected-element/handlers.ts`: for core elements read `node.text.characters`, sync to plugin data `label` if different, send canvas text as `name` in `selection-changed` payload
- [ ] T016 [US1] Verify `handleUpdateElementName` in `src/features/update-element-name/handlers.ts` still writes to both `text.characters` and plugin data `label`; add test coverage if missing
- [ ] T017 [US1] Run `npm run test:run` to verify all canvas text sync tests pass

## Phase 3: Structured Custom Fields (FR-2) — US-2: Structured Custom Fields

**Goal**: Replace free-text textarea with structured name/type field rows stored as YAML. Update import and export features for new format.

**Independent test criteria**: Custom fields UI renders structured rows with add/delete/reorder; fields stored as YAML array; import converts block string to YAML array; markdown export parses new format.

### Tests

- [ ] T018 [US2] Write tests for YAML serialization utilities in `src/features/update-custom-fields/field-utils.test.ts`: serialize/deserialize round-trip, empty array, empty field names/types preserved, special characters handled
- [ ] T019 [US2] Write tests for CustomFieldsEditor component in `src/features/update-custom-fields/CustomFieldsEditor.test.tsx`: renders field rows from YAML, add button appends empty row, delete removes row, up/down arrows reorder, up disabled on first row, down disabled on last, name/type inputs update, onFieldsChange fires on blur with YAML string, onFieldsChange fires immediately on add/delete/reorder

### Implementation

- [ ] T020 [US2] Create `CustomField` interface and implement `serializeFields` / `deserializeFields` in `src/features/update-custom-fields/field-utils.ts`
- [ ] T021 [US2] Implement `CustomFieldsEditor` component in `src/features/update-custom-fields/CustomFieldsEditor.tsx`: props `{ fields: string; onFieldsChange: (yaml: string) => void }`, inline rows with `[Name][Type][↑][↓][×]`, add field button, blur persistence
- [ ] T022 [US2] Export `CustomFieldsEditor` from `src/features/update-custom-fields/index.ts`
- [ ] T023 [US2] Add CSS styles for custom field rows in `src/shared/styles/global.css`
- [ ] T024 [US2] Integrate `CustomFieldsEditor` into `src/features/view-selected-element/ElementEditor.tsx`: replace textarea with `<CustomFieldsEditor>`, update handler to send YAML via `update-custom-fields` message
- [ ] T025 [US2] Verify sandbox handler in `src/features/update-custom-fields/handlers.ts` stores YAML string as-is via `setPluginData('customFields', customFields)` — no changes needed if already format-agnostic
- [ ] T026 [US2] Write tests for import field format conversion in `src/features/import-from-yaml/handlers.test.ts`: block string fields converted to YAML array format during import
- [ ] T027 [US2] Update `src/features/import-from-yaml/handlers.ts`: when setting `customFields` plugin data, convert block string format to YAML array format
- [ ] T028 [US2] Update tests in `src/features/export-slice-to-markdown/handlers.test.ts` to use new YAML field format in test data
- [ ] T029 [US2] Update `formatElement` in `src/features/export-slice-to-markdown/handlers.ts` to parse YAML array format and format as `- name: type` for markdown output
- [ ] T030 [US2] Run `npm run test:run` to verify all custom fields tests pass

## Phase 4: Export Slice to YAML (FR-6) — US-2 Extension

**Goal**: New feature to export a Slice to the import-compatible YAML format (round-trip).

**Independent test criteria**: Selecting a Slice and clicking "Export to YAML" generates valid YAML matching import schema; YAML copied to clipboard with toast.

### Setup

- [ ] T031 Create feature directory `src/features/export-slice-to-yaml/` with `SPEC.md` and `sandbox.ts`

### Tests

- [ ] T032 Write handler tests in `src/features/export-slice-to-yaml/handlers.test.ts`: exports Slice with commands/events/queries to YAML, includes custom fields (YAML array → block string), includes notes, events include external flag, GWT sections with given/when/then arrays, GWT items include name/type/fields, GWT description when present, empty Slice exports with just name, elements without optional keys omit them, output is valid YAML matching import schema

### Implementation

- [ ] T033 Implement `handleExportSliceToYaml` in `src/features/export-slice-to-yaml/handlers.ts`: walk Slice children, categorize by plugin data type, extract name/customFields/notes/external, walk GWT sections for given/when/then, serialize with js-yaml, post `export-slice-to-yaml-result` message
- [ ] T034 Create `src/features/export-slice-to-yaml/sandbox.ts` exporting the handler; register in `src/main.ts`
- [ ] T035 Add "Export to YAML" button in `src/features/view-selected-element/ElementEditor.tsx` visible when Slice is selected (alongside Export to Markdown)
- [ ] T036 Add message handler for `export-slice-to-yaml-result` in `src/features/open-plugin-panel/Panel.tsx`: copy YAML to clipboard and show toast
- [ ] T037 Add i18n key `buttons.exportToYaml` to translation files
- [ ] T038 Run `npm run test:run` to verify all export-slice-to-yaml tests pass

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T039 Update `docs/spec.md`: add ExportSliceToYaml feature row to Feature Index table; verify all modified feature statuses are accurate
- [ ] T040 Run full test suite `npm run test:run` and verify zero failures across all phases

## Dependencies

```
Phase 1 (Remove Dead Code)
  └── no dependencies, can start immediately

Phase 2 (Canvas Text Sync) [US1]
  └── depends on Phase 1 (ElementEditor.tsx cleanup)

Phase 3 (Structured Custom Fields) [US2]
  └── depends on Phase 2 (selection-changed payload changes)
  └── T026-T029 (import/export format updates) depend on T020 (field-utils)

Phase 4 (Export Slice to YAML)
  └── depends on Phase 3 (YAML field format must be in place)

Phase 5 (Polish)
  └── depends on all previous phases
```

## Parallel Execution Opportunities

While optimized for single-threaded execution, these tasks could run in parallel if needed:

- **Phase 1**: T001-T005 (toggle-fields) and T006-T010 (detect-drift) touch different files and could run in parallel
- **Phase 3**: T018+T020 (field-utils) and T019+T021 (CustomFieldsEditor) can run in parallel after field-utils is done
- **Phase 3**: T026-T027 (import) and T028-T029 (markdown export) are independent of each other
- **Phase 4**: T035-T037 (UI) can run in parallel with T033 (handler) after T032 (tests)

## Implementation Strategy

**MVP**: Phase 1 + Phase 2 — removes confusion and establishes canvas text as source of truth. Immediately improves UX.

**Full delivery**: All 4 phases. Phase 3 (structured fields) is the largest effort. Phase 4 (YAML export) is independent and well-scoped.

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | T001–T013 (13) | Remove dead code |
| Phase 2 | T014–T017 (4) | Canvas text sync |
| Phase 3 | T018–T030 (13) | Structured custom fields |
| Phase 4 | T031–T038 (8) | Export slice to YAML |
| Phase 5 | T039–T040 (2) | Polish |
| **Total** | **40 tasks** | |
