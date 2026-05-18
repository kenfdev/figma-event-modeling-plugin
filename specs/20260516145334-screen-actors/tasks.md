# Tasks: Screen Actors

Spec: [specs/20260516145334-screen-actors/spec.md](specs/20260516145334-screen-actors/spec.md)

---

## T001 — Manage actors on user-screens from the panel

- **User Story**: As an Event Modeling author, I want to record, view, edit, and remove the actor names on a user-screen from the plugin panel, so that I can document who uses each screen without leaving the diagram.
- **Spec**: [specs/20260516145334-screen-actors/spec.md#user-stories](specs/20260516145334-screen-actors/spec.md#user-stories)
- **Goal**: When an author selects a user-screen, the plugin panel exposes an editable list of actor names. Changes persist with the screen across selection changes, reloads, and file saves. The actor surface is hidden for system-screens, and the screen's canvas appearance never changes.
- **Scope**:
  - In: Add, view, edit, and remove actor entries on a selected user-screen from the panel.
  - In: Persist the actor list with the screen so it survives reselection, plugin reload, and file save/reopen.
  - In: Show the actor controls only for user-screens; keep them hidden and unstored for system-screens.
  - In: Treat zero actors as the valid "not specified" state, with no residual metadata left behind once all entries are removed.
  - Out: Carrying the actor list through YAML copy/export or import (deferred to T002).
  - Out: Any change to how the screen is rendered on the canvas (badges, labels, icons, tooltips).
  - Out: Linking to existing Actor shapes, autocomplete from prior entries, deduplication, or a project-wide actor catalog.
  - Out: Bulk editing across multiple selected screens.
- **Dependencies**: depends_on: []
- **Acceptance signals**:
  - Selecting a user-screen reveals an actor list in the panel that the author can populate, edit, and clear.
  - After reloading the plugin or reopening the file, the previously entered actors are still shown on the same screen.
  - Selecting a system-screen shows no actor controls and produces no actor metadata on that element.
  - Clearing all actors returns the screen to the "not specified" state with nothing about actors remaining on it.
  - The screen's appearance on the canvas is identical before and after actors are set.
- **Size**: M

---

## T002 — Round-trip screen actors through YAML copy, export, and import

- **User Story**: As an Event Modeling author, I want a user-screen's actor list to travel with the diagram when I copy or export to YAML and to be restored when I import that YAML, so that the actor information survives outside the plugin and through round-trips.
- **Spec**: [specs/20260516145334-screen-actors/spec.md#user-stories](specs/20260516145334-screen-actors/spec.md#user-stories)
- **Goal**: Any YAML representation produced by the plugin for a user-screen includes that screen's actor list as part of the screen's data. Importing such YAML recreates the screen with its actor list intact. YAML authored before this feature continues to load without errors and presents as screens with no actors set.
- **Scope**:
  - In: Include each user-screen's actor list in YAML produced by copy and export flows.
  - In: Restore a user-screen's actor list when importing YAML that contains one.
  - In: Treat actor data as absent on YAML that predates this feature; load such diagrams with no errors and no actors set.
  - Out: Emitting or honoring actor data for system-screens or any non-screen element.
  - Out: Validating actor names against an external catalog or deduplicating across screens during import.
  - Out: Any panel UX changes for managing actors (delivered in T001).
- **Dependencies**: depends_on: [T001]
- **Acceptance signals**:
  - A user-screen with actors set in the plugin appears in the resulting YAML with that actor list attached to the screen.
  - Importing YAML that has actors on a user-screen produces a screen in the plugin whose panel shows the same actor list.
  - A user-screen exported and then re-imported preserves its actor list exactly.
  - Importing a diagram authored before this feature succeeds with no errors and shows no actors on its screens.
  - System-screens neither contribute to nor consume actor data in YAML, regardless of input.
- **Size**: M
