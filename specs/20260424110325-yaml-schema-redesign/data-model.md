# Data Model: YAML Import Schema Redesign

**Created**: 2026-04-24

## YAML Schema (Post-Redesign)

Top-level keys accepted by the parser:

| Key | Required | Type | Notes |
|---|---|---|---|
| `slice` | yes | string | Slice section name. Trimmed; must be non-empty. |
| `screen` | yes | object | Exactly one. See Screen block below. |
| `commands` | no | array | Each entry is a Command (see below). |
| `queries` | no | array | Each entry is a Query (see below). |
| `gwt` | no | array | Unchanged from today. |

Unknown top-level keys (except the removed legacy `events` / `external`) are ignored with a console warning (FR-1.5). Legacy `events` / `external` are hard errors (FR-1.2 / FR-1.3).

### Screen block

```yaml
screen:
  type: user      # required: 'user' | 'system'
  name: Sign Up   # optional: display label; defaults to "Screen" or "Processor"
  reads:          # optional: query names referenced by this slice
    - ExistingUserByEmail
  executes:       # optional: command names triggered by this slice
    - RegisterUser
```

- `type: user` → creates a Screen element (plugin data `type = 'screen'`, gray placeholder with window icon).
- `type: system` → creates a Processor element (plugin data `type = 'processor'`).
- `reads` entries must match `queries[].name` in the same slice (FR-2.7, FR-8).
- `executes` entries must match `commands[].name` in the same slice (FR-2.8, FR-8).

### Commands

```yaml
commands:
  - name: RegisterUser
    fields: |
      email: string
      password: string
    notes: optional note
    produces:                 # NEW
      - UserRegistered
```

- `produces` is a new optional array of event names. Each entry creates a new internal event shape in the current slice's Events column with a Command→Event connector (FR-3).
- Existing `name`, `fields`, `notes` semantics unchanged.

### Queries

```yaml
queries:
  - name: ExistingUserByEmail
    fields: |
      email: string
    from_events:              # NEW
      - UserRegistered
```

- `from_events` is a new optional array of event names. Resolution rules (FR-4):
  1. If name matches an event produced by a command in the same slice (via `commands[].produces`, matched under FR-8), draw Event→Query connector silently.
  2. Else, scan the canvas for existing events with a matching label. If any match, show cross-slice modal; on confirm, draw Event→Query from the chosen canvas event.
  3. Else (no match anywhere), show "Create event?" modal; on Create, spawn a new internal event in the current slice's Events column and draw Event→Query.

### GWT

Unchanged from current schema. No new fields; no connectors drawn inside GWT sections (FR-5.6).

## Internal TypeScript Types

All types live in `src/features/import-from-yaml/parser.ts` (or a `types.ts` sibling file).

```typescript
export interface ImportCommand {
  name: string
  fields?: string
  notes?: string
  produces?: string[]        // NEW
}

export interface ImportQuery {
  name: string
  fields?: string
  notes?: string
  from_events?: string[]     // NEW
}

export interface ImportScreen {           // NEW
  type: 'user' | 'system'
  name?: string
  reads?: string[]
  executes?: string[]
}

export interface ImportData {
  slice: string
  screen: ImportScreen       // now required
  commands?: ImportCommand[]
  queries?: ImportQuery[]
  gwt?: ImportGwt[]
  // ImportEvent and its top-level events[] removed.
}
```

### Phase 4 Resolution Types (shared between UI and sandbox)

```typescript
export interface CandidateEvent {
  nodeId: string          // Figma node id; used for connectors and Focus
  label: string           // original label as shown on canvas
  parentSliceName: string | null
}

export interface PendingResolution {
  queryNodeId: string     // the newly-created query shape in this import
  queryName: string       // original YAML spelling
  eventName: string       // original YAML spelling of the from_events entry
  kind: 'cross-slice' | 'no-match'
  candidates: CandidateEvent[]   // empty for 'no-match'
}

export interface ResolutionAnswer {
  queryNodeId: string
  eventName: string
  decision:
    | { kind: 'connect'; candidateNodeId: string }     // cross-slice confirmed
    | { kind: 'create' }                               // no-match: create new event
    | { kind: 'skip' }                                 // no-match or cross-slice: dismissed
}
```

## Plugin Data

No new plugin data keys. Events created in Phase 2 (from `produces`) or Phase 4 (from "Create event") use the existing `type = 'event'`, `label = <name>`, and optional `customFields` / `notes` keys, matching today's event creation.

Screen/Processor shapes use the existing plugin data set produced by the current `create-screen` and `create-processor` handlers.

## Message Protocol

New / modified sandbox message types:

| Direction | Type | Payload |
|---|---|---|
| UI → Sandbox | `import-from-yaml` | `{ data: ImportData }` (pre-parsed; no more `yamlContent` field) |
| Sandbox → UI | `import-from-yaml-error` | `{ error: string }` (unchanged shape) |
| Sandbox → UI | `import-from-yaml-success` | (unchanged) |
| Sandbox → UI | `import-resolution-needed` | `{ pending: PendingResolution[] }` |
| UI → Sandbox | `import-resolution-answered` | `{ answers: ResolutionAnswer[] }` |
| UI → Sandbox | `focus-node` | `{ nodeId: string }` |

The existing `-error` path is preserved for validation failures (all now raised in the UI before the sandbox message is ever sent, except for unexpected Figma API exceptions during shape creation which still post `import-from-yaml-error`).

## Constants (to be added / changed)

| Constant | Location | Value | Purpose |
|---|---|---|---|
| `SCREEN_ELEMENT_WIDTH`, `SCREEN_ELEMENT_HEIGHT` | `import-from-yaml/handlers.ts` | 200, 160 | Match `create-screen` element size. |
| `PROCESSOR_ELEMENT_WIDTH`, `PROCESSOR_ELEMENT_HEIGHT` | `import-from-yaml/handlers.ts` | (match `create-processor` size) | For `type: system`. |
| `SCREEN_TOP_OFFSET` | `import-from-yaml/handlers.ts` | ~40 | Vertical spacing inside RESERVED_TOP_SPACE. |

Existing constants (`ELEMENT_WIDTH`, `ELEMENT_HEIGHT`, `RESERVED_TOP_SPACE`, color constants) are unchanged.

## State Transitions (Sandbox Import State Machine)

```
        ┌──────────────┐
        │  idle        │
        └──────┬───────┘
               │ receive `import-from-yaml`
               ▼
        ┌──────────────┐
        │ creating     │  Phase 2/3: create slice, shapes, in-slice connectors
        └──────┬───────┘
               │ any pending `from_events` unresolved?
        ┌──────┴─────────────────────┐
        │ no                         │ yes
        ▼                            ▼
  post -success          post `import-resolution-needed`
                                     │
                                     ▼
                         ┌─────────────────────┐
                         │ awaiting-answers    │
                         └──────┬──────────────┘
                                │ receive `import-resolution-answered`
                                ▼
                         ┌─────────────────────┐
                         │ applying-answers    │ create connectors / events
                         └──────┬──────────────┘
                                │
                                ▼
                         post -success
```

While in `awaiting-answers`, the sandbox can still receive `focus-node` messages and handle them without leaving the state.
