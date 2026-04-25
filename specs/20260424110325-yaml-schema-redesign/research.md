# Research: YAML Import Schema Redesign

**Created**: 2026-04-24

## R1: Code Location — Evolve `import-from-yaml` In Place

**Decision**: Modify the existing `src/features/import-from-yaml/` feature rather than creating a new `-v2` feature.

**Rationale**: The new schema is a declared breaking change (spec FR-1.4). Splitting into a v2 feature would force both entry points (the main Panel import section from the UX polish batch and any future CLI/export flows) to keep two variants in sync, and duplicate the clipboard template. A single feature keeps tests, parser, handler, and template in one place. The diff is large but clean.

**Alternatives considered**:
- New `import-from-yaml-v2` folder: Rejected — duplication of Panel wiring, template, and message type.
- Split Phase 4 modal into `import-from-yaml-resolve-events`: Rejected — the modal is tightly coupled to the import state machine, and splitting hides state that belongs with the import.

## R2: Parsing Location — UI Thread

**Decision**: Move YAML parsing and all new schema validation (`screen` block, `produces`, `from_events`, duplicate detection, name matching) into the UI thread. Sandbox receives a pre-structured `ImportData` payload already validated.

**Rationale**:
- `js-yaml` is already bundled into the UI (`src/features/import-from-yaml/parser.ts` imports it today).
- Inline validation errors (FR-6.1, FR-6.2) can render instantly without a sandbox round-trip.
- The UI already owns the clipboard template and the import form, so ownership of schema parsing is natural.
- The sandbox stays focused on Figma API work (creating shapes, drawing connectors, scanning the canvas, zooming the viewport) and does not need a YAML library.
- The Phase 4 resolution flow needs a structured list of pending `from_events` references anyway; those come directly from the parsed data, not from re-parsing in the sandbox.

**Alternatives considered**:
- Parse in sandbox (status quo): Rejected — adds an unnecessary UI→sandbox→UI round-trip per validation attempt.
- Parse in both (defensive double-parse): Rejected — twice the code, unclear ownership of error messages.

## R3: Phase 4 Modal UX — In-Panel Section

**Decision**: Render the cross-slice confirmation modal (FR-4.3) and the "Create event?" modal (FR-4.4) as an in-panel section that replaces the import form while a resolution is pending. One prompt at a time. No separate overlay or portal.

**Rationale**:
- The plugin UI already has no overlay/modal infrastructure; adding portals and backdrops is scope creep for a single feature.
- FigJam's plugin iframe is already effectively modal (the user is engaged with the plugin when they triggered import).
- This reuses existing React component patterns (collapsible sections, inline error boxes).
- Progress through multiple prompts is visible in the same panel real estate, with a running counter (e.g. "Event 2 of 4").

**Alternatives considered**:
- Overlay modal with backdrop: Rejected — requires a new shared Modal component and portal layer for a single UX path.
- Native FigJam notify/confirmation: Rejected — cannot express candidate picker with Focus button.

## R4: Sandbox/UI Coordination — Batched Resolution Round-Trip

**Decision**: After Phase 2/3 completes, the sandbox sends one `import-resolution-needed` message containing every pending `from_events` reference (cross-slice candidates + no-match entries, in encounter order). The UI walks the user through them one-by-one in the panel. When all decisions are collected, the UI sends one `import-resolution-answered` message with the full decision list. The sandbox applies all resulting connector/event creation in a single pass.

**Rationale**:
- Keeps the sandbox state machine simple: three bounded states (imported shapes, awaiting resolutions, done), not one per prompt.
- Reduces message-passing overhead on large imports with many references.
- UI can dedupe same-name "Create event" decisions locally per FR-4.4 ("once created, subsequent same-name references reuse it silently") before sending the answer list.

**Focus exception**: The Focus button on the cross-slice candidate picker requires zooming the canvas viewport mid-prompt. This is a separate fire-and-forget message (`focus-node` UI→sandbox with a `nodeId`), not part of the batched answer. The sandbox handles it by calling `figma.viewport.scrollAndZoomIntoView([node])` and does not post a response.

**Alternatives considered**:
- Chatty one-message-per-prompt: Rejected — more message churn, more sandbox state transitions to test.
- Resolve-before-shapes: Rejected — contradicts spec FR-9 (shapes-first ordering).

## R5: Shared Connector Helper

**Decision**: Extract FigJam connector creation into `src/shared/figma/connectors.ts`, exporting a function like `createConnector(figma, source, target, options?)` that sets `connectorStart`, `connectorEnd`, `connectorLineType = 'CURVED'`, and a black solid stroke. Both `connect-elements/handlers.ts` and the new importer use this helper.

**Rationale**:
- Prevents drift in connector styling (line type, stroke color, magnet) between the two call sites.
- Lets us change connector appearance in one place in the future.
- Matches the "reuse existing helpers" rule in `.claude/rules/reuse-helpers.md`.

**Alternatives considered**:
- Inline duplication: Rejected — two call sites would diverge.
- Place helper inside `connect-elements/` as an exported util: Rejected — `connect-elements/` is a feature, and the importer shouldn't import from peer feature internals.

## R6: Canvas Scanning for Cross-Slice Candidates

**Decision**: In the sandbox, scan the current page once with `figma.currentPage.findAll(n => n.getPluginData('type') === 'event')` at the start of Phase 2 (before any new events are created). Build a map keyed by the FR-8 normalized label. When resolving `from_events` in Phase 3/4, look up candidates by the normalized query name.

**Rationale**:
- Plugin data `type === 'event'` is how the codebase already identifies events.
- Scanning once before Phase 2 avoids picking up events we are about to create in the same import as "cross-slice" candidates.
- The parent Slice (needed for modal disambiguation per FR-4.3) is reachable via `node.parent` when the event lives inside a slice section, or `null`/not-a-slice otherwise.

**Alternatives considered**:
- Per-query scan: Rejected — quadratic for no gain, and the canvas is stable during Phase 2.
- Scan only shapes with matching labels as we need them: Rejected — complicates resolution ordering.

## R7: Viewport Focus Mechanism

**Decision**: Use `figma.viewport.scrollAndZoomIntoView([node])` for the Focus button. It both pans and zooms to fit the node.

**Rationale**: Matches the "visually confirm this is the right event" goal. Does not change selection (the new slice stays selected per spec). Works on any node type including events nested inside a Slice section.

**Alternatives considered**:
- `figma.viewport.zoom = ...` + `figma.viewport.center = ...`: Rejected — manual and doesn't guarantee the node is in view.
- `zoomOnNodes` (non-standard): Not in the Figma public API surface we rely on.

## R8: Mid-Import Failure Handling — No Explicit Rollback

**Decision**: Keep the current pattern: wrap Phase 2/3/post-answer creation in try/catch. On an unexpected error, post `import-from-yaml-error` to the UI and leave any partially-created nodes on the canvas. The user can Cmd/Ctrl+Z to undo.

**Rationale**:
- FigJam groups programmatic node creation into a single undo step, so one Undo reverts the whole in-progress import.
- Explicit rollback (tracking every created node id and deleting them on failure) is substantial complexity for a rare path.
- Matches the existing `handleImportFromYaml` pattern already in production.

**Alternatives considered**:
- Explicit node-id tracking and cleanup on failure: Rejected — complexity vs. benefit.
- Phase 4 only rollback: Rejected — inconsistent behavior across phases.

## R9: Connector Direction vs. Selection Order

**Decision**: The shared connector helper takes explicit `source` and `target` arguments. The importer always passes them in the direction the spec mandates (Query→Screen, Screen→Command, Command→Event, Event→Query). The helper does NOT rely on `figma.currentPage.selection` order, unlike the current `connect-elements` handler which uses selection[0]/[1].

**Rationale**: The importer knows exactly which direction each connector goes; it should not depend on the ambient selection state. The existing `connect-elements` handler can either call the helper with `selection[0]` and `selection[1]` explicitly (unchanged behavior) or stay as-is.

**Alternatives considered**:
- Helper always follows selection order: Rejected — importer doesn't want to change selection for each connector.

## R10: Normalization Function Placement

**Decision**: Add a pure name-normalization function (`normalizeName(s: string): string`) in `src/features/import-from-yaml/parser.ts` (or a sibling `name-match.ts`). Export it so the sandbox can use the identical function when scanning canvas event labels.

**Rationale**:
- FR-8 rules must be applied identically in both contexts (UI validation + sandbox cross-slice scan).
- A single exported function with unit tests guarantees parity.
- It's tiny (trim, collapse whitespace, lowercase) and has no runtime dependencies.

**Alternatives considered**:
- Inline normalization at both call sites: Rejected — drift risk; hard to retest.
- Put in `src/shared/`: Fine, but parser module already sits at the right seam and both UI + sandbox can import from `src/features/import-from-yaml/`. Leaving it in the feature keeps cohesion.
