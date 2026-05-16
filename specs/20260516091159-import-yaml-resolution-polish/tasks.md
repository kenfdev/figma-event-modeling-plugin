# Tasks: Import-from-YAML Resolution Panel Polish

Spec: [specs/20260516091159-import-yaml-resolution-polish/spec.md](specs/20260516091159-import-yaml-resolution-polish/spec.md)

---

## T001 — Polish resolution panel and exclude Given/When/Then events from candidates

- **User Story**: As an event modeler, I want the resolution panel to look and feel like the rest of the plugin so that the import flow feels coherent and trustworthy rather than half-built. As an event modeler, I want the candidate list to only include real network events from other slices so that I am never asked to wire a connector into an example event used to illustrate a scenario. As an event modeler, I want a clear "create it" prompt when no real candidate exists so that I can finish the import without being forced to pick an unrelated example.
- **Spec**: [specs/20260516091159-import-yaml-resolution-polish/spec.md#user-stories](specs/20260516091159-import-yaml-resolution-polish/spec.md#user-stories)
- **Goal**: The resolution panel shown during YAML import looks like a first-class part of the plugin — shared typography, spacing, button styling, and a clear visual hierarchy between primary and secondary actions — and its candidate search no longer surfaces events that live inside Given/When/Then sections. When filtering leaves no candidates for a given reference, the flow falls through to the existing "create it?" prompt rather than skipping silently or showing an empty list.
- **Scope**:
  - In: Visual polish for both prompt variants in the resolution panel (candidate-selection and create-or-skip), using the existing plugin design language.
  - In: Button styling, candidate-row styling, and selected/focused-state styling consistent with the rest of the plugin's panels.
  - In: Exclude events placed inside Given/When/Then sections from the cross-slice candidate search.
  - In: Route the "all candidates filtered out" case to the existing create-or-skip prompt.
  - Out: Any change to the order or count of prompts, or to how skipped references are handled.
  - Out: New interactions such as bulk-resolve, keyboard-only navigation, or in-prompt event renaming.
  - Out: Changes to how example events inside Given/When/Then sections are created, displayed, or stored.
  - Out: Visual changes to panels outside the import-from-YAML resolution flow.
- **Dependencies**: depends_on: []
- **Acceptance signals**:
  - A modeler unfamiliar with the import flow identifies the primary action in each resolution prompt at a glance.
  - The resolution panel is no longer flagged in informal feedback as "unfinished" or visually inconsistent with the rest of the plugin.
  - Importing a slice that references an event name which only exists inside a Given/When/Then section anywhere on the canvas shows the "create it?" prompt for that reference.
  - No connector is drawn from any event located inside a Given/When/Then section as a result of resolution.
  - When at least one matching event exists outside Given/When/Then sections, the resolution panel lists exactly those non-example candidates.
  - The resolution flow produces the same canvas outcomes it did before for every previously-supported choice.
- **Size**: M
