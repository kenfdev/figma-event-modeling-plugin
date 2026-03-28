# Data Model: Plugin UX Enhancements

**Created**: 2026-03-28

## Entities Modified

### Plugin Panel (FR-1)

No new data entities. The `figma.showUI()` call in `init.ts` receives a computed `height` parameter instead of the hardcoded `400`.

**Computation**:
```
height = clamp(Math.round(figma.viewport.bounds.height * 0.8), 400, 1100)
```

### Screen Element (FR-2)

**Before** (group node):
| Property | Value |
|----------|-------|
| Node type | Group (rect + SVG + text) |
| pluginData.type | 'screen' |
| pluginData.label | 'Screen' |

**After** (ShapeWithText node):
| Property | Value |
|----------|-------|
| Node type | ShapeWithText |
| shapeType | 'SQUARE' |
| size | 200×160px |
| fills | `[{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }]` (gray #E5E5E5) |
| cornerRadius | 4 |
| text.characters | 'Screen' |
| text.fills | `[{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }]` |
| pluginData.type | 'screen' |
| pluginData.label | 'Screen' |

No migration. Existing grouped Screen elements continue to work.

### Connector (FR-3)

No plugin data stored on connectors. The connector is a native FigJam ConnectorNode.

| Property | Value |
|----------|-------|
| connectorStart.endpointNodeId | First selected node ID |
| connectorEnd.endpointNodeId | Second selected node ID |
| connectorStart.magnet | 'AUTO' |
| connectorEnd.magnet | 'AUTO' |
| connectorLineType | 'CURVE' |
| strokes | `[{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]` (black) |

### Element YAML Export (FR-4)

No new stored data. YAML is generated on-the-fly from existing pluginData:

**Core shape YAML structure**:
```yaml
name: {pluginData.label}
type: {pluginData.type}          # command | event | query | actor
external: true                    # only for events with pluginData.external === 'true'
fields:                           # only when pluginData.customFields is non-empty
  - fieldName: fieldType
notes: {pluginData.notes}         # only when non-empty
```

**GWT section YAML structure**:
```yaml
name: {section.name}
type: gwt
given:
  - name: {child.label}
    type: {child.type}
    fields:                       # optional
      - fieldName: fieldType
when:
  - name: {child.label}
    type: {child.type}
then:
  - name: {child.label}
    type: {child.type}
```

## Message Protocol Changes

### Modified Messages

| Message | Direction | Change |
|---------|-----------|--------|
| `selection-changed` (multiple) | Sandbox → UI | Add `count: number` to payload |

### New Messages

| Message | Direction | Payload | Handler |
|---------|-----------|---------|---------|
| `connect-elements` | UI → Sandbox | `{}` (empty — reads selection) | `connect-elements/handlers.ts` |
| `copy-element-to-yaml` | UI → Sandbox | `{ id: string }` | `copy-element-to-yaml/handlers.ts` |
| `copy-element-to-yaml-result` | Sandbox → UI | `{ yaml: string }` | Panel.tsx (clipboard copy) |
