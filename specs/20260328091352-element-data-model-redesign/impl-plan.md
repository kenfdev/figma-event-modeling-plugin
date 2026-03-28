# Implementation Plan: Element Data Model Redesign

**Spec**: [spec.md](spec.md)
**Research**: [research.md](research.md)
**Data Model**: [data-model.md](data-model.md)
**Contracts**: [contracts/messages.md](contracts/messages.md)

## Technical Context

| Concern | Decision |
|---------|----------|
| Language | TypeScript |
| UI Framework | React (Vite + Plugma) |
| Test Framework | Vitest + React Testing Library |
| YAML Library | js-yaml (existing dependency) |
| Architecture | Feature-sliced (src/features/<name>/) |
| Testing Strategy | TDD for new features; delete code+tests for removals |
| Canvas Sync | Modify handleSelectionChange in view-selected-element |
| Custom Fields UI | Extract CustomFieldsEditor.tsx to update-custom-fields feature |
| Export YAML | New feature directory: src/features/export-slice-to-yaml/ (independent tree walker, no shared traversal with markdown export) |
| Screen Image | **Descoped** — FigJam drop API is hacky, not native support |

## Implementation Phases

### Phase 1: Remove Dead Code (FR-3 + FR-4)

**Goal**: Remove toggle-fields-visibility and detect-drift features entirely.

#### Task 1.1: Remove toggle-fields-visibility feature
- Delete `src/features/toggle-fields-visibility/` directory (handlers.ts, handlers.test.ts, sandbox.ts, SPEC.md)
- Remove import and handler registration from `src/main.ts`
- Remove UI toggle from `ElementEditor.tsx`:
  - Remove `fieldsVisible` state variable
  - Remove `handleFieldsVisibilityToggle` function
  - Remove the "Show Fields" checkbox JSX block
  - Remove `fieldsVisible` from `SelectedElement` interface
- Remove `fieldsVisible` from `handleSelectionChange` payload in `view-selected-element/handlers.ts`
- Remove i18n key `editor.showFields` from translation files
- Update `docs/spec.md`: mark F3.5 ToggleFieldsVisibility as removed

#### Task 1.2: Remove detect-drift feature
- Delete `src/features/detect-drift/` directory (handlers.ts, handlers.test.ts, sandbox.ts, SPEC.md)
- Remove import and handler registration from `src/main.ts`
- Remove from `Panel.tsx`:
  - Remove `driftDetected` state variable
  - Remove `drift-detected` message handler in useEffect
  - Remove `driftDetected` prop from `<ElementEditor>` call
- Remove from `ElementEditor.tsx`:
  - Remove `driftDetected` prop from `ElementEditorProps`
  - Remove `handleSyncDrift` function
  - Remove sync drift button JSX block
- Remove i18n key `buttons.syncDrift` from translation files
- Update `docs/spec.md`: mark F13.2 DetectDrift as removed
- Remove the `selectionchange` hook that calls `handleSelectionForDrift` from `src/main.ts`

#### Task 1.3: Clean up references
- Remove any remaining references to `fieldsVisible`, `originalStrokeR/G/B`, `drift-detected`, `sync-drift` from codebase
- Run `npm run test:run` to verify no broken imports or references

### Phase 2: Canvas Text Sync (FR-1)

**Goal**: Canvas text becomes the source of truth for element names.

#### Task 2.1: Write tests for canvas text sync behavior
- In `view-selected-element/handlers.test.ts`, add tests:
  - When a core element is selected, `label` plugin data is updated from `text.characters`
  - When canvas text differs from plugin data label, plugin data is overwritten
  - When canvas text matches plugin data label, no write occurs (optimization)
  - Non-core elements (structural, section) are not synced
  - The `selection-changed` payload uses the canvas text as the `name`

#### Task 2.2: Implement canvas text sync in handleSelectionChange
- In `view-selected-element/handlers.ts`:
  - For core elements (command, event, query, actor), read `node.text.characters`
  - If `text.characters !== node.getPluginData('label')`, update plugin data: `node.setPluginData('label', text.characters)`
  - Send the canvas text (not `node.name`) as the `name` in the selection-changed payload
  - Add font loading (`figma.loadFontAsync`) since we may need to read text (actually reading doesn't need font loading, only writing does — verify)

#### Task 2.3: Update handleUpdateElementName
- In `update-element-name/handlers.ts`:
  - Confirm it still writes to both `text.characters` and plugin data `label` (existing behavior is correct)
  - No changes needed unless tests reveal issues

#### Task 2.4: Verify end-to-end
- Run all tests: `npm run test:run`
- Manual test in FigJam: edit text on canvas → reselect → verify panel shows new name

### Phase 3: Structured Custom Fields (FR-2)

**Goal**: Replace free-text textarea with structured name/type field rows.

#### Task 3.1: Create YAML serialization utilities
- Create `src/features/update-custom-fields/field-utils.ts`:
  - `serializeFields(fields: CustomField[]): string` — converts to YAML string
  - `deserializeFields(yaml: string): CustomField[]` — parses YAML to field array
  - `CustomField` interface: `{ name: string; type: string }`
- Write tests in `src/features/update-custom-fields/field-utils.test.ts`:
  - Serialize/deserialize round-trip
  - Empty array → empty YAML
  - Empty field names/types preserved
  - Special characters in field names/types handled

#### Task 3.2: Write tests for CustomFieldsEditor component
- Create `src/features/update-custom-fields/CustomFieldsEditor.test.tsx`:
  - Renders field rows from YAML string
  - Add button appends empty row
  - Delete button removes row
  - Up/down arrows reorder rows
  - Up disabled on first row, down disabled on last row
  - Name/type inputs update on change
  - onFieldsChange callback fires on blur with updated YAML string
  - onFieldsChange fires immediately on add/delete/reorder

#### Task 3.3: Implement CustomFieldsEditor component
- Create `src/features/update-custom-fields/CustomFieldsEditor.tsx`:
  - Props: `{ fields: string; onFieldsChange: (yaml: string) => void }`
  - Internal state: array of `{ name: string; type: string }`
  - Parse `fields` prop (YAML) on mount and when prop changes
  - Render inline rows: `[Name input] [Type input] [↑][↓][×]`
  - Add Field button at bottom
  - On blur of any input: serialize and call `onFieldsChange`
  - On add/delete/reorder: serialize and call `onFieldsChange` immediately
- Export from `src/features/update-custom-fields/index.ts`
- Add CSS rules for new classes in `src/shared/styles/global.css`

#### Task 3.4: Integrate CustomFieldsEditor into ElementEditor
- In `ElementEditor.tsx`:
  - Replace the custom fields textarea with `<CustomFieldsEditor>`
  - Remove `handleCustomFieldsChange` function (textarea onChange)
  - Add new handler that receives YAML from `CustomFieldsEditor` and sends `update-custom-fields` message
  - Import `CustomFieldsEditor` from `../update-custom-fields`

#### Task 3.5: Update sandbox handler for new field format
- In `update-custom-fields/handlers.ts`:
  - Handler receives YAML string (no change needed — it already stores the raw string)
  - Verify the handler just does `node.setPluginData('customFields', customFields)` — this is format-agnostic

#### Task 3.6: Update import-from-yaml field storage
- In `import-from-yaml/handlers.ts`:
  - When setting `customFields` plugin data, convert from block string format to YAML array format
  - The import YAML input still uses `fields: |` block strings (unchanged)
  - Internally: parse the block string, convert each line to a `{ name: type }` object, serialize as YAML array
- Add tests for the conversion logic

#### Task 3.7: Update export-to-markdown field parsing
- In `export-slice-to-markdown/handlers.ts`:
  - The `formatElement` function currently splits `customFields` by newline
  - Update to parse YAML array format and format as `- name: type`
  - Maintain same markdown output format
- Update tests to use new YAML field format in test data

### Phase 4: Export Slice to YAML (FR-6)

**Goal**: New feature to export a Slice to the import-compatible YAML format.

#### Task 4.1: Create feature directory structure
```
src/features/export-slice-to-yaml/
  SPEC.md
  sandbox.ts
  handlers.ts
  handlers.test.ts
```

#### Task 4.2: Write handler tests
- Create `handlers.test.ts`:
  - Exports a Slice with commands, events, queries to YAML
  - Includes custom fields (converted from YAML array to block string)
  - Includes notes
  - Events include external flag
  - GWT sections exported with given/when/then arrays
  - GWT items include name, type, and fields
  - GWT description included when present
  - Empty Slice exports with just the slice name
  - Elements without custom fields/notes omit those keys
  - Output is valid YAML that matches import schema

#### Task 4.3: Implement export handler
- Create `handlers.ts`:
  - `handleExportSliceToYaml(payload: { id: string }, { figma })`
  - Walk Slice children, categorize by plugin data type
  - For each element: extract name (from label), customFields (convert YAML array → block string), notes, external
  - For GWT sections: walk child sections (Given/When/Then), extract elements with name, type, fields
  - Serialize to YAML using js-yaml
  - Post result message: `export-slice-to-yaml-result` with YAML string

#### Task 4.4: Wire up sandbox
- Create `sandbox.ts` exporting the handler
- Register in `src/main.ts`

#### Task 4.5: Add UI button and message handling
- In `ElementEditor.tsx`: add "Export to YAML" button next to "Export to Markdown" (visible when Slice selected)
- In `Panel.tsx`: add message handler for `export-slice-to-yaml-result` that copies YAML to clipboard and shows toast
- Add i18n key `buttons.exportToYaml`

#### Task 4.6: Update docs/spec.md
- Add feature row for ExportSliceToYaml

### ~~Phase 5: Screen Image Placeholder (FR-5)~~ — DESCOPED

> **Decision**: FR-5 is descoped from this plan. FigJam's `figma.on('drop', ...)` API is a hack, not native platform support. The Screen image placeholder feature will be revisited in a future spec with a validated interaction model.

## Files Changed Summary

### Deleted
- `src/features/toggle-fields-visibility/` (entire directory)
- `src/features/detect-drift/` (entire directory)

### New Files
- `src/features/update-custom-fields/CustomFieldsEditor.tsx`
- `src/features/update-custom-fields/CustomFieldsEditor.test.tsx`
- `src/features/update-custom-fields/field-utils.ts`
- `src/features/update-custom-fields/field-utils.test.ts`
- `src/features/update-custom-fields/index.ts` (updated)
- `src/features/export-slice-to-yaml/` (new feature directory)

### Modified
- `src/main.ts` — remove old handlers, add new ones (export-yaml)
- `src/features/view-selected-element/handlers.ts` — canvas text sync
- `src/features/view-selected-element/handlers.test.ts` — new sync tests
- `src/features/view-selected-element/ElementEditor.tsx` — remove Show Fields, drift, add structured fields + YAML export button
- `src/features/open-plugin-panel/Panel.tsx` — remove drift state, add YAML export message handler
- `src/features/import-from-yaml/handlers.ts` — convert field storage format
- `src/features/export-slice-to-markdown/handlers.ts` — parse new field format
- `src/shared/styles/global.css` — new CSS for field rows
- `docs/spec.md` — update feature index
- i18n translation files — remove old keys, add new keys

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| YAML special characters in field names | js-yaml handles quoting automatically; add test cases |
| Canvas text sync timing | Selection event fires after text commit; verified by FigJam behavior |
| Breaking import-from-yaml | Keep import YAML schema unchanged; only convert at storage boundary |
