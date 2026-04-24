# Implementation Plan: YAML Import Schema Redesign

**Created**: 2026-04-24
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)
**Data Model**: [data-model.md](./data-model.md)
**Contracts**: [contracts/messages.md](./contracts/messages.md)
**Quickstart**: [quickstart.md](./quickstart.md)

## Technical Context

| Area | Decision |
|---|---|
| Stack | TypeScript + React + Vite + Plugma (unchanged) |
| Architecture | Feature-sliced; evolve `src/features/import-from-yaml/` in place (R1) |
| Parsing/validation location | UI thread (R2); sandbox receives pre-validated `ImportData` |
| YAML library | `js-yaml` (already bundled) |
| Phase 4 UX | In-panel replacement section — no new modal/portal infrastructure (R3) |
| Sandbox/UI coordination | Batched `import-resolution-needed` / `import-resolution-answered`; separate fire-and-forget `focus-node` (R4) |
| Connectors | New shared helper `src/shared/figma/connectors.ts`; explicit source/target, CURVED, black stroke (R5, R9) |
| Canvas scan | `figma.currentPage.findAll` once at Phase 2 start, keyed by normalized label (R6) |
| Viewport focus | `figma.viewport.scrollAndZoomIntoView([node])` (R7) |
| Failure handling | No explicit rollback; rely on FigJam undo grouping (R8) |
| Name normalization | Shared pure function used by both UI validator and sandbox scanner (R10) |
| Testing | Vitest + React Testing Library, tests alongside feature code; handler coverage required |
| Breaking change | Yes — legacy `events` / `external` / `actor` in screen block are removed; template rewritten |
| New dependencies | None |

## Constitution Check

No `.specify/memory/constitution.md` is present in this repo; project-specific rules come from `AGENTS.md` and `.claude/rules/`. Checked against those:

- **Feature-sliced architecture** — All new code lives in `src/features/import-from-yaml/` or `src/shared/figma/`. ✓
- **Sandbox Message Contract** (AGENTS.md) — Every import path terminates in exactly one `import-from-yaml-success` or `import-from-yaml-error`. The `focus-node` handler is fire-and-forget per the contract exception (it is not an import terminal; it is an ambient side-channel). ✓
- **UI imports from `index.ts`; sandbox imports from `sandbox.ts`** — Enforced in file structure. ✓
- **`reuse-helpers.md`** — Shared connector helper added; UI keeps using existing clipboard helper. ✓
- **`state-management.md`** — New feature does not mutate existing plugin data in ways that require save/restore; created shapes write fresh plugin data only. ✓
- **No React in sandbox** — `ResolutionFlow.tsx` is UI-only; sandbox code is React-free. ✓

No violations.

## Implementation Slices

Order: parser → shared helper → sandbox → UI → docs. Each slice should leave the tree green (`npm run test:run` + `npm run build`).

### Slice 1 — Name Matching Helper

**Files**:
- create `src/features/import-from-yaml/name-match.ts` — `normalizeName(s: string): string`
- create `src/features/import-from-yaml/name-match.test.ts`

**Implementation**:
1. Export `normalizeName(s)`:
   ```typescript
   export function normalizeName(s: string): string {
     return s.trim().replace(/\s+/g, ' ').toLowerCase()
   }
   ```
2. Tests for: trim, collapse whitespace (spaces/tabs/newlines), lowercase, idempotence, empty/whitespace-only input.

**Acceptance**:
- [ ] `normalizeName('  User  Registered  ') === 'user registered'`
- [ ] `normalizeName('UserRegistered') === 'userregistered'`
- [ ] `normalizeName(normalizeName(x)) === normalizeName(x)` for representative inputs
- [ ] All tests pass

---

### Slice 2 — Parser Rewrite

**Files**:
- modify `src/features/import-from-yaml/parser.ts`
- rewrite `src/features/import-from-yaml/parser.test.ts`
- modify `src/features/import-from-yaml/template.ts` (clipboard YAML)
- modify `src/features/import-from-yaml/template.test.ts`

**Implementation**:
1. Replace `ImportEvent` and its top-level array with nothing; remove `external`.
2. Add `ImportScreen` type; make it required on `ImportData`.
3. Add `produces?: string[]` to `ImportCommand` and `from_events?: string[]` to `ImportQuery`.
4. Parser validation rules:
   - Missing `slice` → error (unchanged).
   - Missing `screen` → "Missing required 'screen' block" (FR-2.1).
   - `screen.type` missing or not in `{ user, system }` → error naming the invalid value (FR-2.2).
   - `screen` as array → error (FR-2.3).
   - Top-level `events` present → "Top-level 'events' is no longer supported; use commands[].produces instead" (FR-1.2).
   - Any occurrence of `external` in a command/query/event → legacy error (FR-1.3).
   - `reads` names with no matching `queries[].name` (under `normalizeName`) → error listing the unknown query name (FR-2.7).
   - `executes` names with no matching `commands[].name` (under `normalizeName`) → error listing the unknown command name (FR-2.8).
   - Duplicate names within any single list (`commands[].name`, `queries[].name`, each `produces`, each `from_events`, `screen.reads`, `screen.executes`) under `normalizeName` → error identifying the duplicate (FR-6.5).
   - Unknown top-level keys other than the known set → NOT an error; collect into a `warnings: string[]` field on the result so Panel can log them (FR-1.5).
5. Extend `ParseResult` to optionally carry warnings:
   ```typescript
   type ParseResult =
     | { success: true; data: ImportData; warnings: string[] }
     | { success: false; error: string }
   ```
6. Rewrite tests to cover each error path + a happy path for the Register User example.
7. Update `template.ts` to a new schema YAML example (see data-model.md). `template.test.ts` should parse the template and assert success + the expected shape.

**Acceptance**:
- [ ] Parser rejects every error listed above with a specific message matching FR-6.2 examples
- [ ] Parser accepts the brief's `Register User` YAML and returns the expected `ImportData`
- [ ] Parser returns warnings for unknown top-level keys and still succeeds
- [ ] Template parses back to valid `ImportData`
- [ ] All parser tests pass

---

### Slice 3 — Shared Connector Helper

**Files**:
- create `src/shared/figma/connectors.ts`
- create `src/shared/figma/connectors.test.ts`
- optional: modify `src/features/connect-elements/handlers.ts` to use the helper

**Implementation**:
1. Export `createConnector(figma, source, target)`:
   ```typescript
   export function createConnector(
     figma: PluginAPI,
     source: SceneNode,
     target: SceneNode
   ): ConnectorNode {
     const c = figma.createConnector()
     c.connectorStart = { endpointNodeId: source.id, magnet: 'AUTO' }
     c.connectorEnd   = { endpointNodeId: target.id,   magnet: 'AUTO' }
     c.connectorLineType = 'CURVED'
     c.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
     return c
   }
   ```
2. Tests using the existing `createFigmaMock()` — assert all properties set, direction respected.
3. (Optional, small) update `connect-elements/handlers.ts` to delegate: `createConnector(figma, selection[0], selection[1])`. Tests already exist for that feature; they should still pass.

**Acceptance**:
- [ ] Helper sets `connectorStart.endpointNodeId` from `source.id`, `connectorEnd.endpointNodeId` from `target.id`
- [ ] Line type CURVED, stroke black solid
- [ ] Helper does NOT touch selection
- [ ] Unit tests pass
- [ ] If `connect-elements` is refactored, its tests still pass

---

### Slice 4 — Sandbox Handler Rewrite

**Files**:
- modify `src/features/import-from-yaml/handlers.ts`
- rewrite relevant parts of `src/features/import-from-yaml/handlers.test.ts`
- modify `src/features/import-from-yaml/sandbox.ts` (export new handlers)
- modify `src/main.ts` (wire new message types)

**Implementation**:

1. **Phase 2 — Create in-slice shapes**:
   - Create the Slice section.
   - Pre-scan canvas for existing events: `const canvasEvents = figma.currentPage.findAll(n => n.getPluginData('type') === 'event')`. Index by `normalizeName(node.getPluginData('label'))` → `{ nodeId, label, parentSliceName }[]`.
   - Create screen or processor element from `data.screen` (position: centered above Commands column, inside `RESERVED_TOP_SPACE` per FR-2.9).
     - For `type: user`, mimic `create-screen/handlers.ts` (gray placeholder 200×160; `type='screen'`; label = `data.screen.name ?? 'Screen'`).
     - For `type: system`, mimic `create-processor` similarly.
   - Create commands (top row). Unchanged from current handler.
   - For each `produces`: create an internal event shape in the Events column (same styling as today's internal events: `SQUARE`, orange fill, 176×80, `type='event'`, `label=<original name>`). Track mapping `normalizeName(eventName) → nodeId` for same-slice lookup.
   - Create queries (top row right). Unchanged from current.
   - Create GWT sections. Unchanged.

2. **Phase 3 — In-slice connectors**:
   - For each `screen.reads` name: lookup query nodeId in this slice; `createConnector(queryNode, screenNode)`.
   - For each `screen.executes` name: lookup command nodeId in this slice; `createConnector(screenNode, commandNode)`.
   - For each command's `produces` entry: lookup event nodeId (just created above); `createConnector(commandNode, eventNode)`.
   - For each query's `from_events` entry:
     - If `normalizeName(eventName)` is in the same-slice produces map → `createConnector(eventNode, queryNode)`.
     - Else if it matches ≥1 canvas event → add `{ kind: 'cross-slice', candidates }` to pending.
     - Else → add `{ kind: 'no-match', candidates: [] }` to pending.

3. **Phase 4 dispatch**:
   - If `pending.length === 0` → post `import-from-yaml-success`; select the slice; return.
   - Else: select the slice (so it's visible when prompts appear), post `import-resolution-needed` with the pending array (cross-slice entries first, then no-match entries per FR-9.4).

4. **`import-resolution-answered` handler**:
   - For each answer (index-aligned with the pending list):
     - `connect` → look up candidate nodeId from pending; `createConnector(candidateNode, queryNode)`.
     - `create` → create a new internal event in the current slice's Events column (same styling as step 1's produces events), using the ORIGINAL `eventName` from pending as the label (FR-8.4). Remember the new event nodeId under `normalizeName(eventName)`; any subsequent `create` answer for the same name silently reuses this nodeId (per FR-4.4 reuse rule).
     - `skip` → no action.
   - When all answers applied, post `import-from-yaml-success`.
   - Any thrown error → post `import-from-yaml-error` with the message.

5. **`focus-node` handler**:
   - Look up node by `nodeId`. If missing, `console.warn` and return. If found, call `figma.viewport.scrollAndZoomIntoView([node])`. No response message.

6. **Pending-state bookkeeping**:
   - The sandbox must retain the pending list and the mapping from `queryName`/`eventName` to node ids between the `import-resolution-needed` and `import-resolution-answered` messages. Store as module-level state (e.g., `let pendingImport: { ... } | null = null`) inside the handler module. Cleared on success or error.
   - On a second `import-from-yaml` message while one is pending (shouldn't happen because UI blocks it, but defensive): reset state and proceed with the new import (log a warning).

7. **Tests**:
   - Phase 2/3 happy path for Register User example; assert every connector direction, every shape's plugin data.
   - `type: system` renders a processor, not a screen.
   - Same-slice `from_events` draws connector silently (no pending entry generated).
   - Cross-slice match produces a pending entry with candidate list including `parentSliceName`.
   - No-match produces a pending `no-match` entry.
   - `import-resolution-answered` with mixed decisions draws connectors and/or new events correctly.
   - Reuse: `create` answer for the same name twice → one new event, two connectors.
   - `focus-node` calls `scrollAndZoomIntoView([node])` when node exists; no-op on missing node.
   - No event is created when both `from_events` branches resolve to candidates or to skip.

**Acceptance**:
- [ ] Sandbox state machine transitions: idle → creating → awaiting-answers → idle
- [ ] Every in-slice connector direction matches spec (FR-5)
- [ ] Pending list ordering: cross-slice before no-match (FR-9.4)
- [ ] All handler tests pass

---

### Slice 5 — UI Resolution Flow Component

**Files**:
- create `src/features/import-from-yaml/ResolutionFlow.tsx`
- create `src/features/import-from-yaml/ResolutionFlow.test.tsx`
- modify `src/features/import-from-yaml/index.ts` (export the component)

**Implementation**:
1. Component accepts props:
   ```typescript
   interface Props {
     pending: PendingResolution[]
     onDone: (answers: ResolutionAnswer[]) => void
     onFocus: (nodeId: string) => void
   }
   ```
2. Internal state: `currentIndex`, `answers` (accumulated), plus for cross-slice a `selectedCandidateId`.
3. Render current prompt:
   - For `kind: 'cross-slice'`: title "Connect query `X` to existing event `Y`?"; list of candidates each rendered as a row with label, parent slice name (or "(no slice)"), a Focus button (calls `onFocus(candidate.nodeId)`), and a radio/select-style "Use this one" action. Plus a Skip button. Counter header like "Event 2 of 4".
   - For `kind: 'no-match'`: title "No event named `Y` exists. Create it in this slice?"; two buttons: Create, Skip.
4. Advance to next prompt after an answer. When `currentIndex === pending.length`, call `onDone(answers)`.
5. Skip semantics: appends `{ kind: 'skip' }` to the accumulated answers.
6. Tests:
   - Renders the first prompt's details.
   - Shows the correct counter.
   - Clicking Focus invokes `onFocus` with the expected nodeId.
   - Clicking "Use this one" advances to next prompt; final onDone payload is the expected answers array.
   - Clicking Skip advances; final payload has the skip decision.
   - No-match prompt's Create button appends `{ kind: 'create' }`.
   - Empty `pending` array: component is a no-op (returns null) or explicitly not rendered by Panel.

**Acceptance**:
- [ ] Component renders both prompt types accurately
- [ ] Keyboard-accessible (Enter to confirm default action)
- [ ] Tests pass including snapshot of each prompt type

---

### Slice 6 — Panel Wiring

**Files**:
- modify `src/features/open-plugin-panel/Panel.tsx`
- modify `src/features/open-plugin-panel/Panel.test.tsx` (or the appropriate existing test file)

**Implementation**:
1. Replace the current `handleImport` flow:
   - On Import click, call `parseImportYaml(importYaml)` (UI-side). If error, setImportError and return.
   - If warnings, `console.warn` each (FR-1.5).
   - Otherwise, `parent.postMessage({ pluginMessage: { type: 'import-from-yaml', payload: { data } } }, '*')`.
2. Add state: `const [pending, setPending] = useState<PendingResolution[] | null>(null)`.
3. Listen for `import-resolution-needed` → `setPending(payload.pending)`.
4. While `pending` is non-null, hide the import form and render `<ResolutionFlow pending={pending} onDone={...} onFocus={...} />` in its place.
5. `onDone(answers)` → `parent.postMessage({ pluginMessage: { type: 'import-resolution-answered', payload: { answers } } }, '*')` and `setPending(null)`.
6. `onFocus(nodeId)` → `parent.postMessage({ pluginMessage: { type: 'focus-node', payload: { nodeId } } }, '*')`.
7. On `import-from-yaml-success` while `pending` is null, show success feedback as today. While `pending` is non-null, setPending(null) (shouldn't happen; sandbox only sends success after our answer).
8. On `import-from-yaml-error`: render inline error as today; setPending(null) if non-null.
9. Tests:
   - UI parses YAML locally on Import; inline error for invalid YAML.
   - Sends `import-from-yaml { data }` on valid YAML; does NOT send raw YAML.
   - On `import-resolution-needed`, renders `ResolutionFlow` and hides the import form.
   - On `ResolutionFlow`'s onDone, sends `import-resolution-answered` with the collected answers.
   - onFocus sends `focus-node`.

**Acceptance**:
- [ ] Import flow goes UI parse → sandbox → (optional) ResolutionFlow → sandbox → success
- [ ] Import form hidden while a resolution is in progress
- [ ] All Panel tests pass (no new act() warnings)

---

### Slice 7 — Template, Sample, and Docs

**Files**:
- `sample-import.yaml`
- `docs/spec.md`
- `src/features/import-from-yaml/SPEC.md`

**Implementation**:
1. Rewrite `sample-import.yaml` to the new schema (e.g., use the Register User example).
2. Update `docs/spec.md` Feature Index to reflect the enhanced import; if there's a row for this feature, set Status `Pending` → `Done` ONLY when all slices merge.
3. Rewrite `src/features/import-from-yaml/SPEC.md` to describe the new schema, the connector behavior, the Phase 4 flow, and the FR-8 name matching. Drop `events`/`external`; add `screen`, `produces`, `from_events`.

**Acceptance**:
- [ ] `sample-import.yaml` parses with the new parser
- [ ] `docs/spec.md` Feature Index row updated
- [ ] Feature SPEC.md reflects the new behavior

---

## Task Ordering

Slices are ordered so downstream slices can rely on upstream ones:

1. Slice 1 (name-match) — no dependencies.
2. Slice 2 (parser) — depends on Slice 1.
3. Slice 3 (connector helper) — no dependencies.
4. Slice 4 (sandbox handler) — depends on Slices 1, 3 (and the parser output shape from Slice 2).
5. Slice 5 (ResolutionFlow UI) — depends on the contract types (from data-model) only; can be built in parallel with Slice 4.
6. Slice 6 (Panel wiring) — depends on Slices 2, 5.
7. Slice 7 (docs/template) — last.

Recommended sequential order: 1 → 3 → 2 → 4 → 5 → 6 → 7.

## Risks & Mitigations

- **Pending state leak across imports**: If the sandbox crashes between `import-resolution-needed` and `import-resolution-answered`, subsequent imports could see stale state. Mitigation: reset state at the top of every `import-from-yaml` handler entry.
- **Focus on a deleted node**: User deletes the candidate event between modal render and Focus click. Mitigation: sandbox null-checks the node lookup and logs a console warning instead of throwing.
- **Test surface**: The sandbox state machine is the biggest net-new test surface. Mitigation: dedicated describe blocks for each state transition in `handlers.test.ts`, plus a full end-to-end "mixed pending" scenario.
- **FR-8 normalization surprises**: Aggressive normalization could auto-connect to a visually different event name. Mitigation: the cross-slice modal's Focus button lets the user verify; spec already notes this as a risk.

## Verification

```bash
npm run test:run     # all unit + component tests pass
npm run build        # plugin builds
npm run dev          # manual smoke per quickstart.md Manual Test Plan
```

## Phase 2 (Tasks) — Deferred

Per the Speckit flow, task generation is a separate `/speckit.tasks` step. This plan produces the slice breakdown above; `tasks.md` will enumerate per-slice subtasks including test-first ordering.
