# Spec: Screen Actors

## Overview

User-screens in an Event Modeling diagram represent UI surfaces that people interact with. Today there is no way to record who actually uses a given screen, so that knowledge lives outside the diagram. This feature adds an actors property to user-screens so modelers can capture which people or roles operate each screen as part of the design itself. The information is metadata only — it enriches the model's documentation and YAML representation without changing how the screen looks on the canvas.

**Target users**: Event Modeling authors (product designers, engineers, and analysts) who build and review user-flow diagrams in the plugin.

## User Stories

- As an Event Modeling author, I want to record one or more actor names on a user-screen, so that I can document who uses that screen without leaving the diagram.
- As an Event Modeling author, I want to add, edit, and remove actors on a user-screen from the plugin panel, so that the screen's user information stays current as the design evolves.
- As an Event Modeling reviewer, I want to read a screen's actor list when I select it, so that I can understand the screen's audience without consulting separate documentation.
- As an Event Modeling author, I want a screen's actor list to be included when I copy or export the diagram to YAML, so that the actor information travels with the model.
- As an Event Modeling author, I want imported YAML to restore a screen's actor list, so that round-trip export and import preserve the full screen metadata.

## Functional Requirements

- A user-screen carries an optional list of actor names as metadata.
- The actor list is editable only from the plugin panel when a user-screen is selected.
- Actor names are free-form text entered by the author; no predefined catalog or canvas link is required.
- A screen may have zero, one, or many actors. Zero actors is a valid state and means "not specified".
- The actor list persists with the screen across selection changes, plugin reloads, and file saves.
- The actor list is included in any YAML representation that copies or exports a screen, as part of the screen's data.
- Importing YAML that contains an actor list on a user-screen restores that list on the recreated screen.
- The actor property is exposed only for screens of the user kind; it is hidden and not stored for system-screens.
- The screen's appearance on the canvas is unaffected by the presence, absence, or contents of the actor list.
- Removing all actors returns the screen to the "not specified" state without leaving residual metadata behind.

## Success Metrics

- Authors who set actors on a screen can later see the same list on that screen 100% of the time across reloads and re-selections.
- A user-screen with actors round-trips through YAML export and import with its actor list intact in every case.
- Setting or updating the actor list for a screen takes an author no more than a handful of seconds in the panel.

## Out of Scope

- Selecting actors from existing Actor shapes on the canvas, or otherwise linking screen actors to Actor elements.
- Rendering actor information on the screen shape itself (badges, labels, icons, tooltips on canvas).
- Validating actor names against a project-wide actor catalog, deduplication across screens, or autocomplete from prior entries.
- Exposing the actor property on system-screens, processors, or any non-screen element.
- Bulk editing actors across multiple screens selected at once.
- Reporting, filtering, or searching the diagram by actor.

## Constraints

- Actor information is stored as metadata only; it must not alter the visual representation of screens on the canvas.
- The actor property applies exclusively to user-screens. System-screens never display nor store this property.
- Export and import formats must remain backward compatible: screens authored before this feature (with no actor data) continue to load without errors and present as having no actors set.
