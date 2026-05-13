# Spec: Chain-Direction Connector Anchors

## Overview

When a diagram author connects two adjacent elements along the Event Modeling chain (event → query → screen → command → event), the resulting connector should attach to consistent top/bottom anchor points and carry a single arrowhead pointing in the chain direction. This replaces the current behavior, in which anchor points are chosen automatically and one specific pair (screen → command) renders with arrowheads on both ends. The change makes Event Modeling diagrams read predictably regardless of how the elements are spatially arranged on the canvas or in which order the author selected them.

**Target users**: Event Modeling diagram authors who use the plugin's Connect action to draw chain links between commands, events, queries, screens, and processors.

## User Stories

- As a diagram author, I want connectors between chain-adjacent elements to attach at fixed top or bottom anchors, so that my diagrams have a consistent vertical reading order.
- As a diagram author, I want a chain connector to show a single arrowhead pointing in the chain direction, so that the flow of cause and effect is unambiguous.
- As a diagram author, I want the same anchor placement no matter which of the two elements I selected first, so that I don't have to remember selection order to get a correct-looking diagram.
- As a diagram author working with processors, I want processor connectors to behave the same as screen connectors, so that diagrams that use processors look the same as those that use screens.

## Functional Requirements

- Connectors created between two chain-adjacent elements use the following anchor points, in the chain direction:
  - command → event: starts at the bottom of the command, ends at the top of the event.
  - event → query: starts at the top of the event, ends at the bottom of the query.
  - query → screen: starts at the top of the query, ends at the bottom of the screen.
  - screen → command: starts at the bottom of the screen, ends at the top of the command.
- The anchor placement applies regardless of the order in which the author selected the two elements; the chain direction determines which end is the source and which end is the target.
- Every chain connector renders with exactly one arrowhead, located at the target end (the element receiving the connection).
- Processor elements follow the same anchor and arrowhead rules as screen elements for all four chain-adjacent connection types.
- Pairs that are not chain-adjacent (for example actor with any element, event with screen, two elements of the same type, or pairs involving native shapes or stickies) keep the existing default anchor behavior and existing arrowhead behavior; they are not affected by this change.
- All other Connect behavior — when the action is available, the connector's curve style and color, support for multiple connectors between the same pair, and preservation of the current selection — remains unchanged.

## Success Metrics

- Among diagrams created after the change, the share of chain connectors using the specified top/bottom anchor points reaches at least 99% (residual cases reflect non-chain pairs or unsupported element combinations, not regressions).
- Zero chain connectors render with arrowheads on both ends after the change, across all four chain-adjacent connection types.
- Authors report no perceived difference in correctness when selecting the two elements in reverse chain order versus forward chain order.

## Out of Scope

- Anchor or arrowhead behavior for non-chain pairs (actor pairings, same-type pairings, cross-chain pairings, native shapes, stickies).
- Re-routing or re-anchoring of connectors that already exist on the canvas before the change ships.
- Changes to connector color, curve style, line weight, or other visual styling.
- Anchor rules for connections that go against the chain direction (these continue to be reordered into chain direction by the existing logic, then follow the same forward-direction anchor rules).
- New element types or new positions in the chain.

## Constraints

- The chain order treated as canonical is the existing one: event → query → screen → command → event (cyclic), with processor treated as screen.
- The change must not alter when the Connect action is offered to the author, nor the requirement that exactly two elements be selected.
- Existing connectors on the canvas are not migrated; the new rules apply only to connectors created after the change ships.
