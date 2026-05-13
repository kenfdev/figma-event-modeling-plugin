# Tasks: Chain-Direction Connector Anchors

Spec: [specs/20260513161256-chain-connector-anchors/spec.md](specs/20260513161256-chain-connector-anchors/spec.md)

---

## T001 — Chain-Direction Anchors and Single Arrowhead

- **User Story**: As a diagram author, I want connectors between chain-adjacent elements to attach at fixed top or bottom anchors with a single arrowhead pointing in the chain direction, so that my diagrams read predictably regardless of how I arranged or selected the elements.
- **Spec**: [specs/20260513161256-chain-connector-anchors/spec.md#user-stories](specs/20260513161256-chain-connector-anchors/spec.md#user-stories)
- **Goal**: When a chain-adjacent pair is connected, the resulting connector attaches at the canonical top/bottom anchors for that pair and shows exactly one arrowhead at the target end. The result is identical whether the author selected the source or target element first, and processors behave the same as screens. Non-chain pairs are untouched.
- **Scope**:
  - In: Anchor placement for the four chain-adjacent pairs (command→event, event→query, query→screen, screen→command), in the canonical chain direction.
  - In: Exactly one arrowhead per chain connector, located at the target end; removes the existing double-arrowhead case on screen→command.
  - In: Selection-order invariance — chain direction (not selection order) determines source/target ends.
  - In: Processor elements treated identically to screen elements for all four chain-adjacent connection types.
  - Out: Anchor or arrowhead behavior for non-chain pairs (actor pairings, same-type pairings, cross-chain pairings, native shapes, stickies).
  - Out: Re-anchoring or re-routing of connectors that already exist on the canvas before this ships.
  - Out: Connector color, curve style, line weight, or other visual styling changes.
  - Out: Changes to when the Connect action is offered or to the two-element selection requirement.
- **Dependencies**: depends_on: []
- **Acceptance signals**:
  - Connecting a command and an event in either selection order produces a connector that starts at the command's bottom anchor and ends at the event's top anchor.
  - Connecting an event and a query in either selection order produces a connector from the event's top anchor to the query's bottom anchor.
  - Connecting a query and a screen in either selection order produces a connector from the query's top anchor to the screen's bottom anchor.
  - Connecting a screen and a command in either selection order produces a connector from the screen's bottom anchor to the command's top anchor, with a single arrowhead at the command end (not both ends).
  - Substituting a processor for the screen in any of the above produces visually identical anchor and arrowhead behavior.
  - Every chain connector shows exactly one arrowhead, at the target (chain-downstream) end.
  - Non-chain pairs (actor with anything, same-type pairs, cross-chain pairs, native shapes, stickies) connect with the same anchor and arrowhead behavior as before this change.
- **Size**: M
