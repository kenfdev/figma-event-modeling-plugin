# Implementation Plan: UX Polish Batch

**Created**: 2026-04-03
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)
**Data Model**: [data-model.md](./data-model.md)

## Technical Context

| Area | Decision |
|------|----------|
| Stack | TypeScript + React + Vite + Plugma (unchanged) |
| Architecture | Feature-sliced (src/features/<name>/) |
| Testing | Vitest + React Testing Library, TDD |
| Shape type | `'SQUARE'` (validated in previous Screen element work) |
| RESERVED_TOP_SPACE | 400px (up from 240px) |
| Marker Y offset | 40px (up from 8px) |
| Error display | Inline below textarea, English-only |
| Import UI location | Main Panel, collapsible "Other" section, collapsed by default |
| New dependencies | None |

## Implementation Slices

### Slice 1: FR-1 — Use SQUARE Shape Type for Core Elements

**Files modified**:
- `src/features/create-command/handlers.ts` — change shapeType, remove cornerRadius
- `src/features/create-command/handlers.test.ts` — update assertions
- `src/features/create-event/handlers.ts` — change shapeType, remove cornerRadius
- `src/features/create-event/handlers.test.ts` — update assertions
- `src/features/create-query/handlers.ts` — change shapeType, remove cornerRadius
- `src/features/create-query/handlers.test.ts` — update assertions
- `src/features/create-actor/handlers.ts` — change shapeType, remove cornerRadius
- `src/features/create-actor/handlers.test.ts` — update assertions

**Implementation**:
1. In each handler file:
   - Change `shape.shapeType = 'ROUNDED_RECTANGLE'` → `shape.shapeType = 'SQUARE'`
   - Remove the `COMMAND_CORNER_RADIUS` / `EVENT_CORNER_RADIUS` / etc. constant
   - Remove the `(shape as any).cornerRadius = ...` line
2. Update tests to assert `shapeType = 'SQUARE'` and remove cornerRadius assertions

**Acceptance criteria**:
- [ ] All 4 create handlers use SQUARE shape type
- [ ] No cornerRadius property is set
- [ ] Existing dimensions, colors, strokes unchanged
- [ ] All handler tests pass

---

### Slice 2: FR-1 (continued) — SQUARE Shape Type in YAML Import

**Files modified**:
- `src/features/import-from-yaml/handlers.ts` — change shapeType in all 4 shape creation locations, remove ELEMENT_CORNER_RADIUS
- `src/features/import-from-yaml/handlers.test.ts` — update assertions

**Implementation**:
1. Remove `ELEMENT_CORNER_RADIUS` constant (line 27)
2. In all 4 `figma.createShapeWithText()` blocks (commands ~line 155, events ~line 182, queries ~line 217, GWT items ~line 277):
   - Change `shape.shapeType = 'ROUNDED_RECTANGLE'` → `shape.shapeType = 'SQUARE'`
   - Remove `(shape as any).cornerRadius = ELEMENT_CORNER_RADIUS`
3. Update tests to assert SQUARE shape type

**Acceptance criteria**:
- [ ] All imported elements use SQUARE shape type
- [ ] ELEMENT_CORNER_RADIUS constant removed
- [ ] Import handler tests pass

---

### Slice 3: FR-2 — Increase Top Margin for Imported Slices

**Files modified**:
- `src/features/import-from-yaml/handlers.ts` — change RESERVED_TOP_SPACE constant
- `src/features/import-from-yaml/handlers.test.ts` — update position assertions if any

**Implementation**:
1. Change `const RESERVED_TOP_SPACE = 240` → `const RESERVED_TOP_SPACE = 400` (line 54)
2. No other code changes needed — all positioning logic derives from this constant
3. Update any test assertions that check element Y positions

**Acceptance criteria**:
- [ ] RESERVED_TOP_SPACE is 400
- [ ] Imported elements have more space above command row
- [ ] Slice auto-sizing still works correctly
- [ ] Tests pass

---

### Slice 4: FR-3 — Fix Issue Link Marker Positioning

**Files modified**:
- `src/features/update-slice-issue-url/handlers.ts` — change marker.y
- `src/features/update-slice-issue-url/handlers.test.ts` — update y position assertion

**Implementation**:
1. Change `marker.y = 8` → `marker.y = 40` (line 41)
2. Keep `marker.x = 8` unchanged
3. Update test assertion for marker y position

**Acceptance criteria**:
- [ ] New markers created at y=40
- [ ] Existing markers not repositioned on URL update (current behavior preserved)
- [ ] Tests pass

---

### Slice 5: FR-4 + FR-5 — Move Import to Main Panel with Inline Error Display

**Files modified**:
- `src/features/open-plugin-panel/Panel.tsx` — move import UI, add error handling, add collapsible "Other" section
- `src/features/open-plugin-panel/SettingsPanel.test.tsx` — update/remove import tests from settings, add main panel import tests
- `src/shared/styles/global.css` — add error message styles for import

**Implementation**:

1. **Panel.tsx — Add import state**:
   - Add state: `const [importYaml, setImportYaml] = useState('')`
   - Add state: `const [importError, setImportError] = useState<string | null>(null)`
   - Add state: `const [templateCopied, setTemplateCopied] = useState(false)`
   - Import `YAML_TEMPLATE` (already imported)

2. **Panel.tsx — Add message listener for import errors**:
   - In the `handleMessage` function, add handler for `import-from-yaml-error`:
     ```typescript
     if (message?.type === 'import-from-yaml-error') {
       setImportError(message.payload?.error ?? 'Import failed')
     }
     ```

3. **Panel.tsx — Add "Other" collapsible section** (after Sections ButtonGroup, before ElementEditor):
   ```tsx
   <div className="section">
     <h2
       onClick={() => setCollapsedSections(prev => ({ ...prev, other: !prev.other }))}
       style={{ cursor: 'pointer' }}
     >
       {collapsedSections.other !== false ? '▸' : '▾'} Other
     </h2>
     {collapsedSections.other === false && (
       <div className="import-form">
         <textarea ... />
         {importError && <div className="import-error">{importError}</div>}
         <div className="button-group">
           <button ... onClick={handleImport}>Import</button>
           <button ... onClick={handleCopyTemplate}>Copy Template</button>
         </div>
       </div>
     )}
   </div>
   ```
   Note: `collapsedSections.other` defaults to `undefined` (falsy), so check `!== false` to default collapsed. Actually, use explicit initialization: add `other: true` to initial collapsedSections state OR check `collapsedSections['other'] ?? true`.

4. **Panel.tsx — Import handler**:
   ```typescript
   const handleImport = () => {
     parent.postMessage({ pluginMessage: { type: 'import-from-yaml', payload: { yamlContent: importYaml } } }, '*')
     setImportYaml('')
     setImportError(null)
   }
   ```
   - Clear error on successful import message receipt (add handler in handleMessage)
   - Clear error on textarea onChange: `setImportError(null)` in onChange handler

5. **Panel.tsx — Remove import from SettingsPanel**:
   - Remove import-related state from SettingsPanel (`showImportTextarea`, `importYaml`, `templateCopied`)
   - Remove the import section JSX from SettingsPanel
   - Remove `handleCopyTemplate` from SettingsPanel
   - Keep the `YAML_TEMPLATE` import at the top (still needed by main Panel)

6. **global.css — Add import error styles**:
   ```css
   .import-error {
     color: #d32f2f;
     font-size: 11px;
     margin-top: 4px;
     padding: 4px 8px;
     background: #ffebee;
     border-radius: 4px;
   }
   ```

7. **Tests — Update SettingsPanel.test.tsx**:
   - Remove the `'Import YAML in Settings Panel'` describe block
   - Add new describe block for import in main panel:
     - Test: "Other" section is collapsed by default
     - Test: expanding "Other" shows import textarea
     - Test: sends import-from-yaml message on Import click
     - Test: clears error on textarea edit
     - Test: displays inline error when import-from-yaml-error message received
     - Test: Import button disabled when textarea empty

**Acceptance criteria**:
- [ ] "Other" section visible in main panel, collapsed by default
- [ ] Expanding shows import textarea and button
- [ ] Import sends correct message to sandbox
- [ ] Error message displayed inline on import failure
- [ ] Error clears on textarea edit
- [ ] Error clears on successful import
- [ ] Import removed from settings panel
- [ ] All tests pass

---

## Task Ordering

Slices 1-4 are independent and can be implemented in parallel. Slice 5 is also independent but is the largest change.

Recommended order: 1 → 2 → 3 → 4 → 5 (simplest to most complex)

## Verification

```bash
npm run test:run      # All tests pass
npm run build         # Build succeeds
```
