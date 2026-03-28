# Research: Plugin UX Enhancements

**Created**: 2026-03-28

## R1: Panel Height — Viewport Bounds API

**Decision**: Use `figma.viewport.bounds.height` in the sandbox to compute 80% panel height.

**Rationale**: `figma.viewport.bounds` is already available and used by the project (viewport.center is used in every create-* handler). The bounds property provides the visible canvas area dimensions. Computing `Math.round(bounds.height * 0.8)` then clamping to [400, 1100] gives us the target height in a single synchronous call before `figma.showUI()`.

**Alternatives considered**:
- UI-driven resize (measure `window.screen.height` in iframe, send resize message back) — two-step, visible flash as panel resizes
- Fixed 1100px — ignores spec requirement for 80% on smaller screens

**Implementation note**: `figma.viewport.bounds.height` returns the canvas viewport height in screen pixels at the current zoom level. This is the most accurate proxy for "how tall is the user's plugin area." The existing mock already has `bounds: { x: 0, y: 0, width: 1920, height: 1080 }`.

## R2: Screen Element — Shape Type

**Decision**: Use `figma.createShapeWithText()` with `shapeType: 'SQUARE'` for the simplified Screen element.

**Rationale**: This is the same API used by all core shapes (command, event, query, actor). It produces a single node with embedded text, matching the spec's "single rectangle" requirement. The shape can be resized to 200×160px and styled with gray fill.

**Alternatives considered**:
- `createRectangle()` + separate text node — two nodes, not a single shape
- `createSticky()` — different visual style, limited sizing control

**Implementation notes**:
- `shapeType: 'SQUARE'` with custom resize creates a rectangular shape (SQUARE is just the base type)
- Corner radius, fills, and text properties work the same as ROUNDED_RECTANGLE
- Plugin data (`type: 'screen'`, `label: 'Screen'`) set directly on the ShapeWithText node
- The `view-selected-element` handler already recognizes screen type — no changes needed for selection display

## R3: Connector API

**Decision**: Use `figma.createConnector()` with endpoint node IDs from `figma.currentPage.selection`.

**Rationale**: The Figma Plugin API provides `createConnector()` which returns a ConnectorNode. Endpoints are set via `connectorStart` and `connectorEnd` objects with `endpointNodeId` and `magnet` properties. The mock already supports this (`createConnector` returns an object with `connectorStart`/`connectorEnd`).

**Key API details**:
- `connector.connectorStart = { endpointNodeId: nodeA.id, magnet: 'AUTO' }`
- `connector.connectorEnd = { endpointNodeId: nodeB.id, magnet: 'AUTO' }`
- `connector.connectorLineType = 'CURVE'` — sets curve style (vs 'STRAIGHT' or 'ELBOWED')
- Stroke color: `connector.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]`
- The connector automatically stays attached when endpoint nodes are moved (FigJam native behavior)

**Alternatives considered**: None — this is the standard FigJam connector API.

## R4: Copy Element to YAML — Format

**Decision**: Use `js-yaml` (already a project dependency) with a manually constructed object for the flat format.

**Rationale**: The existing `export-slice-to-yaml` feature already uses `js-yaml`. The flat format (name, type, optional fields/notes/external) maps directly to a plain JS object dumped with `yaml.dump()`.

**Key details**:
- Core shapes: `{ name, type, fields?, notes?, external? }` — fields as YAML array of `- key: type` entries
- GWT sections: `{ name, type: 'gwt', given: [...], when: [...], then: [...] }` — reuses the same per-element format
- The existing `formatFieldsAsBlockString()` in `export-slice-to-yaml/handlers.ts` formats fields as block strings. For the flat format, we need array-style fields (`- userId: string`), which `deserializeFields()` from `field-utils.ts` already provides as structured data.
- Slices: delegate to existing `export-slice-to-yaml` handler (same button label and behavior)

**Alternatives considered**:
- Custom YAML string building — fragile, prone to quoting issues
- Shared utility module — not needed since js-yaml handles formatting

## R5: Selection Count in Multi-Select Payload

**Decision**: Add `count: number` to the existing `selection-changed` payload when `multiple: true`.

**Rationale**: The UI needs to conditionally render the Connect button only when exactly 2 elements are selected. The sandbox already determines `selection.length > 1` — passing the count is a trivial addition to the existing message.

**Implementation**: In `view-selected-element/handlers.ts`, change the multi-selection branch from `{ multiple: true }` to `{ multiple: true, count: selection.length }`.
