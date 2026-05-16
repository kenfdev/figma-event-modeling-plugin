# Spec: Import-from-YAML Resolution Panel Polish

## Overview

When importing a slice from YAML, the plugin may surface a sequence of prompts asking the modeler to resolve event references it could not match within the current slice — either by picking an existing event from another slice or by creating a new one. This resolution panel currently looks unfinished compared to the rest of the plugin: plain unstyled controls, no clear hierarchy, and visually inconsistent with surrounding panels. This feature brings the resolution panel up to the same visual standard as the rest of the plugin and tightens the candidate search so that example events sitting inside Given/When/Then sections are no longer offered as connection targets.

**Target users**: Event modelers using the FigJam plugin to import slices from YAML.

## User Stories

- As an event modeler, I want the resolution panel to look and feel like the rest of the plugin so that the import flow feels coherent and trustworthy rather than half-built.
- As an event modeler, I want the candidate list to only include real network events from other slices so that I am never asked to wire a connector into an example event used to illustrate a scenario.
- As an event modeler, I want a clear "create it" prompt when no real candidate exists so that I can finish the import without being forced to pick an unrelated example.

## Functional Requirements

- The resolution panel uses the same visual language as the other plugin panels: matching typography, spacing, button styling, and color treatment.
- Primary and secondary actions in the resolution panel are visually distinct, so the modeler can tell at a glance which choice commits the current selection versus which one defers or cancels it.
- The candidate list, the focused-event highlight, and the selected state are visually consistent with how selection is represented elsewhere in the plugin.
- The "no event found — create it?" prompt uses the same styled controls as the candidate-selection prompt.
- When searching the canvas for events that match an unresolved reference, events placed inside Given/When/Then sections are excluded from the candidate list.
- If excluding example events leaves no candidates for a given reference, the flow proceeds to the "no event found — create it?" prompt rather than skipping silently or showing an empty list.
- The overall sequence and outcomes of the resolution flow — order of prompts, what each choice produces on the canvas, and how skipped references are handled — remain unchanged.

## Success Metrics

- A modeler unfamiliar with the import flow can identify the primary action in the resolution panel on first glance without reading button labels twice.
- Zero connectors are drawn from example events inside Given/When/Then sections after an import that triggers resolution.
- Modelers describe the import resolution UI as belonging to the same plugin as the rest of the panels in informal feedback (no longer flagged as "unfinished" or "ugly").

## Out of Scope

- Changing the order, count, or logical behavior of the resolution prompts.
- Reworking the underlying YAML schema, import phases, or connector-drawing rules.
- Adding new interactions beyond visual polish, such as bulk-resolve, keyboard-only navigation, or in-prompt event renaming.
- Adjusting how example events inside Given/When/Then sections are created, displayed, or stored.
- Visual changes to panels outside the import-from-YAML resolution flow.

## Constraints

- The new look must reuse the plugin's existing design language rather than introduce a parallel one.
- Example events inside Given/When/Then sections must continue to be created on import; the change is strictly about excluding them from candidate searches.
