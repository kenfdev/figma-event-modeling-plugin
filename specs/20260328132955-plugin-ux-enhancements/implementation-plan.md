# Implementation Plan: Plugin UX Enhancements

**Created**: 2026-03-28
**Branch**: `improvements`
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)
**Data Model**: [data-model.md](./data-model.md)

## Technical Context

| Area | Decision |
|------|----------|
| Stack | TypeScript + React + Vite + Plugma (unchanged) |
| Architecture | Feature-sliced (src/features/<name>/) |
| Testing | Vitest + React Testing Library, TDD |
| Panel height source | `figma.viewport.bounds.height` (sandbox-side) |
| Screen shape API | `figma.createShapeWithText()` with SQUARE type |
| Connector API | `figma.createConnector()` with CURVE line type |
| YAML library | `js-yaml` (existing dependency) |
| New feature dirs | `connect-elements/`, `copy-element-to-yaml/` |
| Selection count | Add `count` to existing multi-select payload |

## Implementation Slices

### Slice 1: FR-1 — Taller Plugin Panel

**Files modified**:
- `src/features/open-plugin-panel/init.ts` — compute height from viewport bounds
- `src/features/open-plugin-panel/init.test.ts` — test height calculation

**Implementation**:
1. In `initializePlugin()`, before `figma.showUI()`:
   - Read `figma.viewport.bounds.height`
   - Compute `Math.round(height * 0.8)`
   - Clamp to `Math.max(400, Math.min(1100, computed))`
2. Pass computed height to `figma.showUI(__html__, { width: 300, height: computed, ... })`
3. Tests: verify height=720 for bounds.height=900, height=1100 for bounds.height=2000, height=400 for bounds.height=400

**Acceptance criteria**:
- [ ] Panel opens at 80% of viewport height
- [ ] Capped at 1100px maximum
- [ ] Floored at 400px minimum
- [ ] Width remains 300px
- [ ] Resize handle still works

---

### Slice 2: FR-2 — Simple Screen Element

**Files modified**:
- `src/features/create-screen/handlers.ts` — rewrite to use createShapeWithText
- `src/features/create-screen/handlers.test.ts` — update tests
- `src/features/create-screen/paste-handler.ts` — review if paste logic needs updates for new node type
- `src/features/create-screen/paste-handler.test.ts` — update if needed

**Implementation**:
1. Replace group-based creation with `figma.createShapeWithText()`:
   - `shape.shapeType = 'SQUARE'`
   - `shape.resize(200, 160)`
   - `shape.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }]`
   - `shape.cornerRadius = 4`
   - Load Inter Medium font, set `shape.text.characters = 'Screen'`
   - `shape.text.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }]`
   - `shape.setPluginData('type', 'screen')`, `shape.setPluginData('label', 'Screen')`
2. Remove SVG icon constant, group creation, and text node creation
3. Review `paste-handler.ts` — the image paste detection may reference group structure
4. Update `view-selected-element` if it has special handling for group-based screens

**Acceptance criteria**:
- [ ] Screen created as single ShapeWithText node (not group)
- [ ] 200×160px, gray fill, 4px corner radius
- [ ] "Screen" text label displayed
- [ ] Plugin data set on the shape node directly
- [ ] Selection shows "Screen" type in panel

---

### Slice 3: FR-3 — Connect Two Elements

**New files**:
- `src/features/connect-elements/SPEC.md`
- `src/features/connect-elements/handlers.ts`
- `src/features/connect-elements/handlers.test.ts`
- `src/features/connect-elements/sandbox.ts`

**Files modified**:
- `src/main.ts` — register `connect-elements` handler
- `src/features/view-selected-element/handlers.ts` — add `count` to multi-select payload
- `src/features/view-selected-element/handlers.test.ts` — test count in payload
- `src/features/view-selected-element/ElementEditor.tsx` — add Connect button when multipleSelected and count===2
- `src/features/view-selected-element/ElementEditor.test.tsx` — test Connect button visibility
- `src/features/open-plugin-panel/Panel.tsx` — pass selectionCount to ElementEditor

**Implementation**:
1. **Selection count**: In `handleSelectionChange`, when `selection.length > 1`, send `{ multiple: true, count: selection.length }`
2. **Panel state**: In `Panel.tsx`, store `selectionCount` from the message payload, pass to `ElementEditor`
3. **Connect button**: In `ElementEditor`, when `multipleSelected && count === 2`, render a "Connect" button that posts `{ type: 'connect-elements' }`
4. **Handler**: `handleConnectElements` reads `figma.currentPage.selection`, validates length===2, creates connector:
   ```typescript
   const connector = figma.createConnector()
   connector.connectorStart = { endpointNodeId: selection[0].id, magnet: 'AUTO' }
   connector.connectorEnd = { endpointNodeId: selection[1].id, magnet: 'AUTO' }
   connector.connectorLineType = 'CURVE'
   connector.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
   ```
5. **Wire up**: Register handler in `main.ts`, export from `sandbox.ts`

**Acceptance criteria**:
- [ ] Connect button visible only when exactly 2 elements selected
- [ ] Creates curved black connector between them
- [ ] Works for any two connectable shapes (not just plugin elements)
- [ ] Connector stays attached on element move
- [ ] Multiple connectors between same pair allowed
- [ ] Selection preserved after connect

---

### Slice 4: FR-4 — Copy Element to YAML

**New files**:
- `src/features/copy-element-to-yaml/SPEC.md`
- `src/features/copy-element-to-yaml/handlers.ts`
- `src/features/copy-element-to-yaml/handlers.test.ts`
- `src/features/copy-element-to-yaml/sandbox.ts`

**Files modified**:
- `src/main.ts` — register `copy-element-to-yaml` handler
- `src/features/view-selected-element/ElementEditor.tsx` — add "Copy to YAML" button for core shapes and GWT sections
- `src/features/view-selected-element/ElementEditor.test.tsx` — test button visibility and click behavior
- `src/features/open-plugin-panel/Panel.tsx` — handle `copy-element-to-yaml-result` message (clipboard + toast)

**Implementation**:
1. **Handler** (`copy-element-to-yaml/handlers.ts`):
   - Receive `{ id: string }`, get node via `figma.getNodeByIdAsync(id)`
   - Read `pluginData`: type, label, customFields, notes, external
   - For core shapes: build `{ name, type, external?, fields?, notes? }` object
   - For GWT: traverse children sections (Given/When/Then), build nested structure
   - Use `yaml.dump()` to serialize
   - Post `copy-element-to-yaml-result` message with YAML string
2. **Field formatting**: Import `deserializeFields` from `update-custom-fields/field-utils`. Convert to `- name: type` YAML array format.
3. **UI button**: In `ElementEditor`, show "Copy to YAML" button for types: command, event, query, actor, gwt. Not shown for: lane, chapter, processor, screen.
4. **Slice delegation**: For `slice` type, the existing "Export to YAML" button already handles this (no change needed).
5. **Clipboard + toast**: In `Panel.tsx`, listen for `copy-element-to-yaml-result`, call `copyToClipboard(yaml)`, show toast.

**Acceptance criteria**:
- [ ] "Copy to YAML" button shown for command, event, query, actor, gwt
- [ ] Not shown for lane, chapter, processor, screen
- [ ] Core shape YAML: flat format with name, type, optional fields/notes/external
- [ ] GWT YAML: name, type:gwt, given/when/then arrays with child elements
- [ ] External events include `external: true`
- [ ] Elements without fields omit `fields` key
- [ ] Toast notification on copy
- [ ] Slice uses existing Export to YAML button (no change)

---

## Implementation Order

```
Slice 1 (FR-1: Panel Height) ──────────────────► independent
Slice 2 (FR-2: Screen Simplification) ─────────► independent
Slice 3 (FR-3: Connect Elements) ──────────────► modifies ElementEditor + selection handler
Slice 4 (FR-4: Copy Element to YAML) ──────────► modifies ElementEditor + Panel message handler
```

Recommended order: **1 → 2 → 3 → 4** (slices 1 and 2 are fully independent and can be done in parallel; slice 3 before 4 because the selection count change is a prerequisite context for understanding the multi-select UI area that slice 4 also touches).

## Feature Index Updates

After all slices complete, add rows to `docs/spec.md` Feature Index:

| ID | Feature | Status | Spec |
|----|---------|--------|------|
| F16.1 | TallerPluginPanel | Done | `src/features/open-plugin-panel/SPEC.md` |
| F16.2 | SimpleScreenElement | Done | `src/features/create-screen/SPEC.md` |
| F16.3 | ConnectElements | Done | `src/features/connect-elements/SPEC.md` |
| F16.4 | CopyElementToYaml | Done | `src/features/copy-element-to-yaml/SPEC.md` |
