# Message Contracts: YAML Import Schema Redesign

**Created**: 2026-04-24
**Scope**: Messages exchanged between `src/ui/` (React) and `src/main.ts` (Figma sandbox) for the import flow.

All messages follow the plugin's standard envelope:

```typescript
// UI → Sandbox
parent.postMessage({ pluginMessage: { type, payload } }, '*')

// Sandbox → UI
figma.ui.postMessage({ type, payload })
```

Every sandbox handler still emits exactly one `success`/`error` terminal message per import per the Sandbox Message Contract in AGENTS.md.

---

## UI → Sandbox

### `import-from-yaml`

Triggered when the user clicks Import in the panel with valid YAML. The UI has already parsed and fully validated the YAML (including new FR-1.2, FR-1.3, FR-1.5, FR-2, FR-3, FR-4, FR-6, FR-8 rules).

```typescript
{
  type: 'import-from-yaml',
  payload: {
    data: ImportData
  }
}
```

Sandbox response: exactly one of

- `import-resolution-needed` (then later `import-from-yaml-success` after the answer round-trip completes), or
- `import-from-yaml-success` (if there were no unresolved `from_events` references), or
- `import-from-yaml-error` (if a Figma API call unexpectedly throws during shape/connector creation).

### `import-resolution-answered`

Sent after the user has walked through every prompt in the in-panel resolution flow.

```typescript
{
  type: 'import-resolution-answered',
  payload: {
    answers: ResolutionAnswer[]
  }
}
```

`answers` is ordered the same as the sandbox's `pending` list (index-aligned) so the sandbox doesn't re-match by (queryNodeId, eventName).

Sandbox response: exactly one of

- `import-from-yaml-success`, or
- `import-from-yaml-error`.

### `focus-node`

Fire-and-forget. Sent when the user clicks **Focus** on a cross-slice candidate during the resolution flow.

```typescript
{
  type: 'focus-node',
  payload: {
    nodeId: string
  }
}
```

Sandbox response: none. Sandbox calls `figma.viewport.scrollAndZoomIntoView([node])` and silently returns. If the node does not exist (rare — user deleted it mid-prompt), sandbox logs a warning and returns. The resolution flow is not interrupted.

---

## Sandbox → UI

### `import-resolution-needed`

Sent after Phase 2 (shape creation) and Phase 3 (in-slice connectors) complete, iff at least one `from_events` reference is unresolved (either has canvas candidates or has no match anywhere).

```typescript
{
  type: 'import-resolution-needed',
  payload: {
    pending: PendingResolution[]
  }
}
```

The `pending` array is ordered:
1. All `kind: 'cross-slice'` entries first, in encounter order across queries and `from_events` arrays.
2. Then all `kind: 'no-match'` entries, in encounter order.

This ordering matches the spec's FR-9.4 phase ordering (cross-slice modals before no-match modals).

While the sandbox is awaiting answers, the UI MUST NOT send another `import-from-yaml`. The import panel should block further imports until a `-success` or `-error` terminal message arrives.

### `import-from-yaml-success`

Unchanged shape; sent in one of three moments:
- Immediately after Phase 3 if there were no unresolved references.
- After `import-resolution-answered` is processed successfully.
- On explicit user cancel of the entire resolution flow (see "Cancellation" below — optional; if we support it, the sandbox still sends success because the slice shapes are already on the canvas).

```typescript
{
  type: 'import-from-yaml-success'
}
```

### `import-from-yaml-error`

Unchanged shape. Sent when:
- A Figma API call throws during Phase 2/3/apply-answers.
- The payload of `import-from-yaml` is malformed in a way that passed UI validation (defense-in-depth; should not happen in practice).

```typescript
{
  type: 'import-from-yaml-error',
  payload: {
    error: string
  }
}
```

---

## Payload Type Definitions

```typescript
// Import data (post-parse, post-validate)
interface ImportScreen {
  type: 'user' | 'system'
  name?: string
  reads?: string[]
  executes?: string[]
}

interface ImportCommand {
  name: string
  fields?: string
  notes?: string
  produces?: string[]
}

interface ImportQuery {
  name: string
  fields?: string
  notes?: string
  from_events?: string[]
}

interface ImportData {
  slice: string
  screen: ImportScreen
  commands?: ImportCommand[]
  queries?: ImportQuery[]
  gwt?: ImportGwt[]   // unchanged
}

// Phase 4 resolution
interface CandidateEvent {
  nodeId: string
  label: string
  parentSliceName: string | null   // "(no slice)" rendered in UI when null
}

interface PendingResolution {
  queryNodeId: string
  queryName: string
  eventName: string
  kind: 'cross-slice' | 'no-match'
  candidates: CandidateEvent[]   // [] for 'no-match'
}

type ResolutionDecision =
  | { kind: 'connect'; candidateNodeId: string }
  | { kind: 'create' }
  | { kind: 'skip' }

interface ResolutionAnswer {
  queryNodeId: string
  eventName: string
  decision: ResolutionDecision
}
```

---

## Sequence: Happy path (no unresolved references)

```
UI                                   Sandbox
 |  import-from-yaml { data }  ─────▶ |
 |                                    | parse? no, already parsed
 |                                    | Phase 2: create shapes
 |                                    | Phase 3: in-slice connectors
 |                                    | no pending
 |  ◀───── import-from-yaml-success   |
 | show success UI                    |
```

## Sequence: Mixed pending (cross-slice + no-match)

```
UI                                   Sandbox
 |  import-from-yaml { data }  ─────▶ |
 |                                    | Phase 2/3
 |                                    | pending: [X-slice for A, no-match for B]
 |  ◀─── import-resolution-needed     |
 | render prompt for A (candidates)   |
 |  ── focus-node (candidate 1) ────▶ |
 |                                    | scrollAndZoomIntoView
 |  ── focus-node (candidate 2) ────▶ |
 |                                    | scrollAndZoomIntoView
 | user confirms candidate 1          |
 | render prompt for B (no-match)     |
 | user clicks Skip                   |
 |  ─ import-resolution-answered ───▶ |
 |       [connect A→cand1, skip B]    |
 |                                    | apply-answers: draw A connector, B nothing
 |  ◀──── import-from-yaml-success    |
 | show success UI                    |
```

---

## Cancellation (Optional)

If the user closes the plugin panel or navigates away while the sandbox is in `awaiting-answers`, the sandbox has no signal. The FigJam panel just disappears. The shapes created in Phase 2/3 stay on the canvas as-is. No explicit cancel message is required.

If we later want an explicit cancel button in the panel, add a `cancel-import-resolution` UI → Sandbox message that causes the sandbox to emit `import-from-yaml-success` without drawing any Phase 4 connectors. Out of scope for this feature.
