# Spec: Navigate to Connected Shapes

## Overview

When a single shape is selected on the canvas, modelers often need to follow its connections to inspect or edit a neighboring shape — a downstream event, the screen that issues a command, the actor that triggers a flow. Today this requires zooming out, locating the connector visually, and panning to the other end, which gets painful on dense diagrams. This feature surfaces the selected shape's directly connected neighbors in the plugin panel and lets the modeler jump to any of them in one click, without adding any new canvas chrome.

**Target users**: Event Modeling diagram authors and reviewers working in FigJam — typically product designers, engineers, and architects collaboratively mapping a domain.

## User Stories

- As a diagram author, I want to see which shapes are connected to my currently selected shape, so that I can understand its immediate relationships without scanning the canvas.
- As a diagram author, I want to jump from a selected shape to one of its connected neighbors in one click, so that I can follow a flow without manually panning and zooming.
- As a diagram reviewer, I want incoming and outgoing connections shown separately, so that I can read the direction of flow at a glance.
- As a diagram author, I want navigation to reach native FigJam shapes that I've connected to plugin elements, so that mixed diagrams don't break the chain.
- As a diagram author, I want the navigation list to disappear when the selected shape has no connections, so that the panel stays uncluttered for isolated shapes.

## Functional Requirements

- When exactly one shape is selected and it has at least one connector attached, the plugin panel shows a list of its directly connected neighbors below the existing selected-element editor.
- Connections are determined solely by explicit connectors drawn on the canvas; semantic or proximity-based relationships are not inferred.
- Neighbors are grouped into two labeled lists: incoming connections (connectors pointing to the selected shape) and outgoing connections (connectors pointing away from it).
- Each neighbor row shows a colored type indicator and the neighbor's name, mirroring how the rest of the panel identifies element types.
- Native FigJam nodes that are connected to the selected shape (shapes, stickies, images, text) appear in the list using their native name, with a generic type indicator when no plugin type is set.
- Structural and section elements (Lane, Chapter, Processor, Screen, Slice, GWT) appear as neighbors when a connector attaches to them.
- Clicking a neighbor row selects that neighbor and centers the viewport on it, so the user lands at the target shape with it already selected and ready to edit.
- When no shape is selected, or when multiple shapes are selected, or when the selected shape has zero connectors, the navigation list is not displayed at all.
- When the list of neighbors is long, the list is scrollable within a bounded height so that the rest of the panel remains usable.
- The list reflects the live state of the canvas: when connectors are added, removed, or rerouted, or when neighbor names change, the panel updates without requiring the user to re-select the shape.
- Jumping does not modify the diagram in any way — no shapes, connectors, names, or plugin data are changed by navigation.

## Success Metrics

- Authors of diagrams containing at least 30 shapes reach a chosen connected neighbor in under 3 seconds from the moment of selecting the source shape, versus the multi-second pan-and-zoom they do today.
- After the feature ships, at least 70% of single-shape selections on diagrams with 30+ shapes are followed by at least one navigation jump within a working session, indicating the feature is discovered and used.
- Qualitative feedback from diagram authors describes the navigation list as "uncluttered" or equivalent in at least 4 out of 5 informal reviews.
- Zero reported cases of navigation-induced edits to the diagram (the action must remain read-only with respect to canvas content).

## Out of Scope

- Inferring "connections" from anything other than explicit connectors — same-slice membership, Event Modeling chain neighbors without a connector, or visual proximity are not treated as connections.
- Navigation UI rendered on the canvas itself (floating handles, overlays, on-shape buttons).
- Showing navigation for multi-selection. Selecting two or more shapes hides the navigation list.
- Creating, deleting, or rerouting connectors from the navigation list.
- Filtering, sorting, or searching the neighbor list.
- Multi-hop navigation (e.g. "follow this chain two steps downstream"); only direct neighbors are listed.
- Keyboard shortcuts dedicated to jumping between neighbors.
- Breadcrumb or history of recently visited shapes.

## Constraints

- The plugin runs in FigJam; navigation must use only the canvas capabilities FigJam exposes to plugins for selecting a node and bringing a node into view.
- Visual style must remain consistent with the existing single-selection panel, including the established type-badge colors.
- The feature must not block or noticeably delay the rest of the panel when the selected shape has many connectors; the bounded scrollable list is the mechanism for this.
- Deferred: behavior when a connector exists but the node it references has been deleted (orphan connector handling) — leave the row off the list for now, revisit if it occurs in practice.
