# Tasks: Navigate to Connected Shapes

Spec: [specs/20260516155401-navigate-connected-shapes/spec.md](specs/20260516155401-navigate-connected-shapes/spec.md)

---

## T001 — Navigate to Connected Shapes

- **User Story**: As a diagram author, I want to see which shapes are connected to my currently selected shape and jump to any of them in one click, so that I can follow flows without manually panning the canvas. (Covers all five stories in the spec: list visibility, one-click jump, direction grouping, native-shape reach, and clean empty/multi-select states.)
- **Spec**: [specs/20260516155401-navigate-connected-shapes/spec.md#user-stories](specs/20260516155401-navigate-connected-shapes/spec.md#user-stories)
- **Goal**: A diagram author selecting a single connected shape sees, inside the plugin panel, a compact list of that shape's directly connected neighbors split into incoming and outgoing groups, and can click any row to select that neighbor and bring it into view. The list reflects live canvas changes and disappears when it has nothing useful to show.
- **Scope**:
  - In: Show grouped Incoming / Outgoing lists of directly-connected neighbors under the existing single-selection editor.
  - In: Each row shows a colored type indicator plus the neighbor's name, including a generic indicator for native FigJam shapes, stickies, images, and text.
  - In: Clicking a row selects the neighbor and centers the viewport on it; navigation never modifies the diagram.
  - In: Hide the navigation section entirely when no shape is selected, when multiple shapes are selected, or when the selected shape has zero connectors.
  - In: List is scrollable within a bounded height when there are many neighbors.
  - In: Panel updates reactively as connectors and neighbor names change, without requiring re-selection.
  - Out: Inferring connections from anything other than explicit connectors (no chain/proximity/slice-membership inference).
  - Out: On-canvas navigation handles, overlays, breadcrumbs, multi-hop traversal, filtering, search, or keyboard shortcuts.
  - Out: Multi-selection navigation, creating/editing/deleting connectors from the list.
- **Dependencies**: depends_on: []
- **Acceptance signals**:
  - With one connected plugin shape selected on a FigJam canvas, the panel shows an Incoming group and an Outgoing group listing every directly-connected neighbor.
  - Clicking a neighbor row selects that shape on the canvas and the viewport recenters on it.
  - A selected shape that has zero connectors shows no navigation section at all — the panel looks exactly like it does today for that shape.
  - Selecting two or more shapes hides the navigation section.
  - A connected native FigJam shape (sticky, image, plain shape) appears in the list with its native name and a generic indicator, and is reachable by clicking.
  - Adding, removing, or rerouting a connector — or renaming a neighbor — updates the panel without re-selecting the source shape.
  - A shape with many connectors keeps the rest of the panel usable: the list scrolls within a bounded height.
  - No diagram content (shapes, connectors, names, plugin data) changes as a result of any navigation action.
- **Size**: M
