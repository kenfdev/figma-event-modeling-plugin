# Tasks: YAML Import Schema Redesign

**Created**: 2026-04-24
**Plan**: [impl-plan.md](./impl-plan.md)
**Spec**: [spec.md](./spec.md)

## Organization

Tasks are organized by the 7 implementation slices from `impl-plan.md`, not by spec user stories (US-1..US-5 all flow through one import pipeline, so slicing by user story would cut perpendicular to the actual delivery units). Because of that, tasks do NOT carry `[US#]` labels — they carry slice phases instead. `[P]` marks tasks that are parallelizable with other tasks in the same phase (different files, no cross-task ordering dependency).

**TDD rhythm**: for each file pair (`foo.ts` + `foo.test.ts`), the test task comes first and is expected to fail; the implementation task follows to make it pass.

## Phase 1: Setup

- [ ] T001 Verify `npm install` succeeds and `npm run test:run` passes on `main` before starting (no new dependencies — `js-yaml` already in package.json).

## Phase 2: Foundational — Prerequisites for All Later Slices

Completes Slice 1 (name matching) and Slice 3 (shared connector helper). Both are pure, dependency-free modules that later slices import from.

### Slice 1 — Name Matching Helper

- [ ] T002 [P] Write unit tests for `normalizeName` in `src/features/import-from-yaml/name-match.test.ts` — cover trim, whitespace collapse (spaces/tabs/newlines), lowercase, idempotence, and empty/whitespace-only input.
- [ ] T003 [P] Implement `normalizeName(s: string): string` in `src/features/import-from-yaml/name-match.ts` so T002 passes. Use `s.trim().replace(/\s+/g, ' ').toLowerCase()`.

### Slice 3 — Shared Connector Helper

- [ ] T004 [P] Write unit tests for `createConnector` in `src/shared/figma/connectors.test.ts` — assert `connectorStart.endpointNodeId === source.id`, `connectorEnd.endpointNodeId === target.id`, `magnet === 'AUTO'` on both ends, `connectorLineType === 'CURVED'`, and stroke is solid black. Use `createFigmaMock()` from `src/shared/test/mocks/figma.ts`.
- [ ] T005 [P] Implement `createConnector(figma, source, target)` in `src/shared/figma/connectors.ts` so T004 passes. Do NOT touch selection.
- [ ] T006 [P] Refactor `src/features/connect-elements/handlers.ts` to use `createConnector` helper, passing `selection[0]` and `selection[1]`. Verify existing tests in `src/features/connect-elements/handlers.test.ts` still pass — do NOT change those tests.

## Phase 3: Parser Rewrite (Slice 2)

Depends on Phase 2 (imports `normalizeName`). Replaces the legacy top-level `events` array with the new `screen` block, `produces`, and `from_events`. All validation from FR-1, FR-2, FR-3, FR-4, FR-6, FR-8 runs here.

- [ ] T007 Update TypeScript types in `src/features/import-from-yaml/parser.ts` — remove `ImportEvent` and `data.events`; add `ImportScreen` (with `type: 'user' | 'system'`, optional `name`, `reads`, `executes`); make `screen` required on `ImportData`; add `produces?: string[]` to `ImportCommand`; add `from_events?: string[]` to `ImportQuery`; change `ParseResult` success variant to `{ success: true; data: ImportData; warnings: string[] }`. No parser logic changes yet — keep the old validation body for now so downstream imports still compile (tests for new schema will fail, that's expected).
- [ ] T008 Rewrite `src/features/import-from-yaml/parser.test.ts` — delete legacy `events`/`external` test cases; add test cases for each of: (a) brief's Register User happy path, (b) missing `screen`, (c) `screen.type` missing / invalid value, (d) `screen` as array, (e) legacy top-level `events` key, (f) `external` key anywhere, (g) unknown `reads` name, (h) unknown `executes` name, (i) duplicates in each of `commands[].name`, `queries[].name`, `produces`, `from_events`, `screen.reads`, `screen.executes`, (j) unknown top-level key produces warning but succeeds, (k) normalized matching across cases/whitespace. Expect failures until T009.
- [ ] T009 Replace the parser body in `src/features/import-from-yaml/parser.ts` with the new validation — import `normalizeName`; enforce every rule described in impl-plan.md § Slice 2, step 4; accumulate `warnings[]` for unknown top-level keys; produce error messages matching the FR-6.2 examples in spec.md. Make T008 pass.
- [ ] T010 Rewrite `src/features/import-from-yaml/template.ts` — update `YAML_TEMPLATE` to the new schema (Register User example with `screen`, `produces`, `from_events`; no top-level `events`).
- [ ] T011 Update `src/features/import-from-yaml/template.test.ts` — parse the new template and assert success, no errors, no warnings, and a reasonable shape (presence of `screen.type === 'user'`, at least one command with `produces`, at least one query with `from_events`).

## Phase 4: Sandbox Handler Rewrite (Slice 4)

Depends on Phase 2 + Phase 3. Creates the slice and all in-slice shapes, draws in-slice connectors, emits `import-resolution-needed`, handles the answer and `focus-node` messages.

- [ ] T012 Expand `src/features/import-from-yaml/handlers.test.ts` with a new describe block for Phase 2 (shape creation) covering: (a) slice section created with `data.slice` name and `type='slice'` plugin data, (b) `type: user` creates a Screen element (gray, 200×160, `type='screen'`, label from `screen.name ?? 'Screen'`), (c) `type: system` creates a Processor element, (d) screen shape is horizontally centered above the Commands column within `RESERVED_TOP_SPACE`, (e) every `produces` entry becomes an internal orange event in the Events column with `type='event'` and the ORIGINAL YAML label (FR-8.4), (f) GWT creation unchanged. Expect failures until T014.
- [ ] T013 Expand `src/features/import-from-yaml/handlers.test.ts` with a new describe block for Phase 3 (in-slice connectors) covering: (a) one connector per `screen.reads` entry, direction Query→Screen, (b) one per `screen.executes`, Screen→Command, (c) one per `produces`, Command→Event, (d) same-slice `from_events` entry draws Event→Query silently with no pending entry. Assert the `createConnector` helper was invoked with the correct source/target node ids. Expect failures until T014.
- [ ] T014 Rewrite `src/features/import-from-yaml/handlers.ts` — implement Phase 2 and Phase 3 per impl-plan.md § Slice 4 steps 1-2. Pre-scan the canvas once: `const canvasEvents = figma.currentPage.findAll(n => n.getPluginData('type') === 'event')`, indexed by `normalizeName(label)`. Use `createConnector` from `src/shared/figma/connectors.ts`. Make T012 and T013 pass. Leave Phase 4 dispatch for T016.
- [ ] T015 Add handler tests for Phase 4 dispatch in `src/features/import-from-yaml/handlers.test.ts`: (a) when pending is empty, sandbox posts `import-from-yaml-success` and selects the slice; (b) when there are cross-slice candidates, sandbox posts `import-resolution-needed` with candidates containing `{ nodeId, label, parentSliceName }` and `kind: 'cross-slice'`; (c) when a name has no match anywhere, sandbox posts `import-resolution-needed` with a `kind: 'no-match'` entry (empty candidates); (d) pending array ordering — cross-slice entries before no-match entries (FR-9.4). Expect failures until T016.
- [ ] T016 Extend `src/features/import-from-yaml/handlers.ts` with Phase 4 dispatch logic (impl-plan.md § Slice 4 step 3). Introduce module-level state `let pendingImport` holding the parsed data, node id maps, and pending list. Reset it at the top of every `import-from-yaml` entry. Make T015 pass.
- [ ] T017 Add handler tests for `import-resolution-answered` in `src/features/import-from-yaml/handlers.test.ts`: (a) `connect` decision draws Event→Query connector from candidate to query; (b) `create` decision creates a new internal event in the current slice's Events column with the ORIGINAL name and draws Event→Query; (c) `skip` decision does nothing; (d) reuse rule — two `create` answers for the same name create ONE event and TWO connectors; (e) after all answers applied, sandbox posts `import-from-yaml-success`; (f) error during application posts `import-from-yaml-error`. Expect failures until T018.
- [ ] T018 Implement the `import-resolution-answered` handler in `src/features/import-from-yaml/handlers.ts` (impl-plan.md § Slice 4 step 4). Wire it in `src/features/import-from-yaml/sandbox.ts`. Make T017 pass.
- [ ] T019 Add handler tests for `focus-node` in `src/features/import-from-yaml/handlers.test.ts`: (a) valid nodeId → calls `figma.viewport.scrollAndZoomIntoView([node])` and posts no message; (b) unknown nodeId → logs a warning, does not throw, posts no message. Expect failures until T020.
- [ ] T020 Implement the `focus-node` handler in `src/features/import-from-yaml/handlers.ts`. Export it from `src/features/import-from-yaml/sandbox.ts`. Make T019 pass.
- [ ] T021 Wire the new message types in `src/main.ts` — register `import-resolution-answered` and `focus-node` alongside the existing `import-from-yaml`. Confirm existing message routing pattern is preserved.

## Phase 5: Resolution Flow UI (Slice 5)

Depends on data-model.md and contracts/messages.md types (not on sandbox implementation). Can be implemented in parallel with Phase 4 if helpful.

- [ ] T022 Write component tests in `src/features/import-from-yaml/ResolutionFlow.test.tsx` covering: (a) empty `pending` array renders null (or is not rendered — pick one), (b) cross-slice prompt renders the query name, each candidate with label + parent slice name + Focus button, (c) "(no slice)" text when `parentSliceName` is null, (d) clicking Focus invokes the `onFocus` prop with the candidate nodeId, (e) selecting a candidate and confirming advances to the next prompt and appends `{ kind: 'connect', candidateNodeId }` to accumulated answers, (f) clicking Skip appends `{ kind: 'skip' }`, (g) no-match prompt renders "No event named X exists. Create it in this slice?" with Create/Skip buttons, (h) Create appends `{ kind: 'create' }`, (i) counter renders "Event N of M", (j) on final prompt, onDone fires with the complete answers array. Expect failures until T023.
- [ ] T023 Implement `src/features/import-from-yaml/ResolutionFlow.tsx` with the prop shape `{ pending, onDone, onFocus }` and internal state tracking `currentIndex` and accumulated `answers`. Make T022 pass. Keep the component keyboard-accessible (Enter triggers the default button).
- [ ] T024 Export `ResolutionFlow` and the resolution type definitions from `src/features/import-from-yaml/index.ts` so Panel can import them.

## Phase 6: Panel Wiring (Slice 6)

Depends on Phases 3 (parser) and 5 (ResolutionFlow).

- [ ] T025 Update the existing Panel tests covering import (most likely `src/features/open-plugin-panel/Panel.test.tsx` or `SettingsPanel.test.tsx`) to assert: (a) clicking Import now runs parsing in the UI; on parse error, sets inline error state and does NOT post any message; (b) on parse success, posts `import-from-yaml` with `{ data }` payload (no `yamlContent`); (c) warnings from the parser are `console.warn`'d (spy on `console.warn`); (d) on receipt of `import-resolution-needed`, the import form is hidden and `ResolutionFlow` is rendered with the received pending list; (e) `ResolutionFlow.onDone(answers)` posts `import-resolution-answered { answers }` and restores the import form; (f) `ResolutionFlow.onFocus(nodeId)` posts `focus-node { nodeId }`; (g) on `import-from-yaml-success` the form is restored and success feedback shown; (h) on `import-from-yaml-error` the inline error is displayed. Expect failures until T026.
- [ ] T026 Update the relevant Panel component file (`src/features/open-plugin-panel/Panel.tsx` — and any shared state split out from it) to: (a) import `parseImportYaml` and `ResolutionFlow` from the import feature; (b) parse on Import click; (c) manage `pending` state; (d) wire `onDone` / `onFocus` handlers; (e) handle the three sandbox response messages. Make T025 pass. No `act()` warnings (per AGENTS.md).

## Phase 7: Template, Sample, and Docs (Slice 7)

- [ ] T027 [P] Rewrite `sample-import.yaml` at the repo root to the new schema (Register User example from the brief).
- [ ] T028 [P] Rewrite `src/features/import-from-yaml/SPEC.md` to describe the new schema, the connector directions, the Phase 4 resolution flow, the FR-8 name-matching rule, and the updated template. Remove any mention of `events`/`external`.
- [ ] T029 [P] Update `docs/spec.md` Feature Index — if an `import-from-yaml` row exists, update its description to cite the new schema and mark Status `Done` after T030 lands. Also confirm color/sizing reference is unchanged.

## Phase 8: Polish & Cross-Cutting

- [ ] T030 Run full verification: `npm run test:run` (all tests green) and `npm run build` (bundle succeeds). Fix any lingering drift. Commit.

## Dependencies

```
T001  (Setup)
  │
  ▼
Phase 2  ── T002 → T003   (Slice 1 — name-match)
         ── T004 → T005 → T006   (Slice 3 — connector helper + connect-elements refactor)
  │
  ▼
Phase 3  ── T007 → T008 → T009 → T010 → T011   (Slice 2 — parser + template)
  │
  ▼
Phase 4  ── T012 → T013 → T014          (Slice 4 — Phase 2/3 impl)
         ── T015 → T016                 (Phase 4 dispatch)
         ── T017 → T018                 (apply answers)
         ── T019 → T020                 (focus-node)
         ── T021                        (wire main.ts)
  │
  ▼
Phase 5  ── T022 → T023 → T024   (Slice 5 — ResolutionFlow UI)   [can run in parallel with Phase 4]
  │
  ▼
Phase 6  ── T025 → T026   (Slice 6 — Panel wiring)   [requires Phase 3 + Phase 5]
  │
  ▼
Phase 7  ── T027 [P], T028 [P], T029 [P]
  │
  ▼
Phase 8  ── T030
```

Parallel notes:
- T002/T003 and T004/T005/T006 have no dependencies on each other.
- T022-T024 (Slice 5 UI) can be developed in parallel with T012-T021 (Slice 4 sandbox) because the contracts/types in `contracts/messages.md` are fixed.
- T027/T028/T029 are independent docs tasks.

## Format Validation

All tasks above conform to the required checklist format:

- ✅ Each line starts with `- [ ]`.
- ✅ Each has a sequential `T###` id.
- ✅ `[P]` is used where truly parallelizable (different files, no in-phase ordering).
- ✅ No `[Story]` labels (the chosen organization is slice-oriented, not user-story-oriented — see Organization note at the top).
- ✅ Every task cites concrete file paths.

## Total Task Count

30 tasks across 8 phases.

| Phase | Tasks | Focus |
|---|---|---|
| 1 Setup | 1 | Preflight |
| 2 Foundational | 5 (T002-T006) | Name match + connector helper |
| 3 Parser | 5 (T007-T011) | Schema parse + template |
| 4 Sandbox | 10 (T012-T021) | Shape creation, connectors, modal dispatch, answer apply, focus, main.ts |
| 5 UI | 3 (T022-T024) | `ResolutionFlow` component |
| 6 Panel | 2 (T025-T026) | Panel integration |
| 7 Docs | 3 (T027-T029) | sample, SPEC, docs |
| 8 Polish | 1 (T030) | Full verification |

## Implementation Strategy

- The parser (Phase 3) is the earliest point where you can eyeball-validate the schema rewrite against the spec (FR-1/2/3/4/6/8) by running `npm run test:run` after T009 — it tests the whole new schema without any Figma API.
- After Phase 4, you have a headless sandbox-side feature. Write real YAML, call handlers directly in tests, and trace the full state machine without the UI.
- Phase 5 can be developed concurrently against the fixed contract types — a second developer or second session can do it in parallel.
- Phase 6 is the integration point where everything meets; keep its tests focused on message flow, not on parser/sandbox behavior (those are already covered upstream).
- Phase 7 (docs/template) is the smallest phase and benefits from being last — you know what you built.
