# Feature: Navigate to Connected Shapes

Source spec: [specs/20260516155401-navigate-connected-shapes/spec.md](../../../specs/20260516155401-navigate-connected-shapes/spec.md)

## Summary

When exactly one shape is selected on a FigJam canvas, the plugin panel lists the directly connected neighbors of that shape — grouped into Incoming and Outgoing — and lets the user jump to any neighbor with a single click.

## Acceptance Criteria

- Selecting a single shape with at least one attached connector shows two grouped lists (Incoming, Outgoing) beneath the existing single-selection editor.
- Each neighbor row shows a colored type indicator (matching plugin element colors) and the neighbor's name. Native FigJam shapes (sticky, image, plain shape, text) appear with a generic gray indicator and the node's native name.
- Clicking a neighbor row selects that neighbor on the canvas and recenters the viewport on it. No diagram content is modified.
- Selecting zero or multiple shapes hides the navigation section entirely.
- A selected shape with zero connectors shows no navigation section.
- The list is scrollable within a bounded height when many neighbors are connected.
- Connector add/remove/reroute and neighbor renames update the list live without re-selecting the source shape.
- Orphan connectors (referencing a deleted node) are skipped from the list.

## Technical Notes

- Sandbox finds connectors via `figma.currentPage.findAll(n => n.type === 'CONNECTOR')`.
- For each connector touching the selected node: if `connectorEnd.endpointNodeId === selectedId`, the other end is incoming; if `connectorStart.endpointNodeId === selectedId`, the other end is outgoing.
- Neighbor metadata comes from `node.getPluginData('type')` (falls back to `'native'`) and `node.text?.characters ?? node.name` for core types, `node.name` otherwise.
- Live updates: the feature subscribes to both `selectionchange` and `documentchange`.
- Navigation handler uses `figma.getNodeByIdAsync(id)`, then `figma.currentPage.selection = [node]` and `figma.viewport.scrollAndZoomIntoView([node])`.
