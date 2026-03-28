# Data Model: Element Data Model Redesign

## Plugin Data Keys (per Figma node)

### Core Elements (command, event, query, actor)

| Key | Type | Description | Changed? |
|-----|------|-------------|----------|
| `type` | string | Element type identifier | Unchanged |
| `label` | string | Element name (synced from canvas text on selection) | **Modified**: now synced from canvas text, not just written from panel |
| `customFields` | string (YAML) | Structured field definitions | **Modified**: format changes from free-text to YAML array |
| `notes` | string | Free-text notes | Unchanged |
| `external` | "true"/"false" | Event external flag (events only) | Unchanged |
| `fieldsVisible` | ~~string~~ | ~~Toggle state~~ | **Removed**: no longer read or written |
| `originalStrokeR/G/B` | ~~string~~ | ~~Saved stroke for drift~~ | **Removed**: no longer read or written |

### Screen Elements

| Key | Type | Description | Changed? |
|-----|------|-------------|----------|
| `type` | string | "screen" | Unchanged |
| `label` | string | Screen name | Unchanged |

> Note: FR-5 (Screen Image Placeholder) was descoped. No changes to Screen plugin data in this iteration.

### Structural & Section Elements

No changes to lane, chapter, processor, slice, gwt plugin data keys.

## Custom Fields Storage Format

### Previous Format (free-text string)
```
userId: string
amount: number
status: string
```

### New Format (YAML string)
```yaml
fields:
  - userId: string
  - amount: number
  - status: string
```

### TypeScript Representation
```typescript
interface CustomField {
  name: string
  type: string
}

// Parsed from YAML:
// { fields: Array<Record<string, string>> }
// Each array item is a single key-value pair: { [name]: type }

// Example:
// fields: [{ userId: "string" }, { amount: "number" }]
// Maps to CustomField[]:
// [{ name: "userId", type: "string" }, { name: "amount", type: "number" }]
```

## Message Protocol Changes

### New Messages

| Message | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `export-slice-to-yaml` | UI → Sandbox | `{ id: string }` | Request YAML export of a Slice |
| `export-slice-to-yaml-result` | Sandbox → UI | `{ yaml: string }` | YAML export result for clipboard |

### Modified Messages

| Message | Change |
|---------|--------|
| `update-custom-fields` | Payload `customFields` changes from free-text to YAML string |
| `selection-changed` | Payload now reads `label` from canvas text (synced), removes `fieldsVisible` |

### Removed Messages

| Message | Reason |
|---------|--------|
| `toggle-fields-visibility` | FR-3: feature removed |
| `sync-drift` | FR-4: feature removed |
| `drift-detected` | FR-4: feature removed |

## State Transitions

No state transitions in this iteration (Screen image placeholder descoped).
