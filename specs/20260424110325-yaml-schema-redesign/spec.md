# YAML Import Schema Redesign

## Overview

Redesign the YAML import schema to reflect Event Modeling relationships directly: every slice declares a `screen` (user-facing or system) that reads queries and executes commands, commands declare the events they `produces`, and queries declare the events they are constructed `from_events`. The importer draws connectors between these elements in the correct direction so that an imported slice is a complete, navigable Event Model rather than disconnected columns.

## Clarifications

### Session 2026-04-24

- Q: How should the new schema relate to the existing top-level `events` array and `external` flag? → A: Replace — breaking change. Top-level `events` and `external` are dropped. Events only exist as targets of `commands[].produces` or as references in `queries[].from_events`.
- Q: Which way should the arrows point between the new element relationships? → A: Query → Screen, Screen → Command, Command → Event, Event → Query. Actors are not connected to anything by the importer.
- Q: How should the plugin find candidate event shapes for cross-slice `from_events` and confirm the connection? → A: Search the whole canvas for event shapes with a matching name and prompt the user via a modal before drawing each connector.
- Q: What is the shape of the `screen` block? → A: Drop the `actor` field. Add a `type` field that is either `user` (renders a Screen shape) or `system` (renders a Processor shape). Keep `reads` and `executes`.
- Q: Further `screen` details? → A: `screen` has a `name` field (defaults to "Screen"/"Processor"), single `screen` per slice, invalid/missing `type` is a hard import error.
- Q: Where should the screen be placed in the imported slice layout? → A: In the top row above the commands, using the reserved top space introduced by the UX polish batch.
- Q: How should `screen.reads`/`screen.executes` names be validated? → A: Strict — they must match queries/commands defined in the same slice. Unknown names fail the import with an inline error.
- Q: Is `screen` required per slice? → A: Yes. A slice without a `screen` block fails validation.
- Q: Do GWT elements also get connectors? → A: No. GWT sections remain text-only shapes without internal arrows (unchanged from today).
- Q: How is the cross-slice modal presented when multiple `from_events` need confirmation? → A: One modal per event (sequential), not a single batched modal.
- Q: What happens if the user dismisses/cancels a cross-slice confirmation modal? → A: Skip that connector only. The query itself is still created, and the rest of the import completes normally.
- Q: How should names be matched across `screen.reads`/`screen.executes`/`commands[].produces`/`queries[].from_events` and their targets? → A: Case-insensitive with whitespace normalized. `UserRegistered`, `userregistered`, `user registered`, and `USER REGISTERED` all match the same target.
- Q: How are duplicate names within a single list handled (e.g. two commands with the same `name`, or a `produces: [X, X]`)? → A: Fail validation. Any duplicate within `commands[].name`, `queries[].name`, `produces`, `from_events`, `screen.reads`, or `screen.executes` aborts the import with an inline error identifying the duplicate.
- Q: What disambiguation info should the cross-slice modal show when multiple canvas events match a `from_events` name? → A: Candidate event name + its parent slice name + a "Focus" button that zooms the FigJam viewport to that event on the canvas.
- Q: Where is the screen/processor placed horizontally within the top-row reserved space? → A: Horizontally centered above the Commands column.
- Q: How should unknown top-level fields (typos, removed legacy keys other than `events`/`external`) be handled? → A: Warn but allow. Unknown keys do not fail the import; they are logged to the plugin console. `events` and `external` remain hard errors (they have a migration story). Any other unknown top-level or subkey is ignored with a console warning.
- Q: When does the cross-slice `from_events` modal appear relative to slice shape creation? → A: Shapes first, modals after. The importer creates the slice, all in-slice shapes, and all in-slice connectors (including same-slice `from_events` connectors), THEN shows modals sequentially for each unresolved cross-slice `from_events` reference.
- Q: What should happen when a `from_events` name matches nothing (no same-slice produce, no canvas candidate)? → A: Prompt the user with a "Create event?" / "Skip" modal. On Create, spawn a new internal (orange) event shape inside the current slice's Events column and draw the Event→Query connector. This replaces the previous "silently do nothing" behavior.
- Q: When and how does the new "Create event?" prompt interact with the cross-slice modal and with subsequent same-name references? → A: It runs in the same Phase 4 (after all in-slice shapes and connectors are drawn) and appears AFTER the cross-slice modals for that import. If the user chooses Create for an unmatched name and a later query in the same import references the same name, the importer silently connects to the just-created event (no second prompt). Choosing Skip raises no error.

## Problem Statement

The current YAML import schema describes Event Modeling elements as three independent lists (`commands`, `events`, `queries`) with no relationships between them. After import, users must manually:

1. Draw every connector between commands, events, queries, and the screen/processor that triggers them.
2. Decide where a screen or processor element belongs and create it by hand.
3. Remember which events belong to which slice and which are shared across slices.

This makes YAML import a layout shortcut rather than a way to capture the structure of an Event Model. It also means the imported diagram is visually incomplete immediately after import, and the YAML file itself doesn't document the causal relationships that make an Event Model useful.

## User Stories

### US-1: Declare the Screen/Processor That Drives a Slice
As a modeler, I want to declare a `screen` block in each slice with a type (`user` or `system`), so the importer creates the correct screen or processor shape in the right position without me placing it manually.

### US-2: Declare What Commands Produce
As a modeler, I want to list the events each command `produces`, so the importer creates those events and draws Command→Event connectors automatically.

### US-3: Declare How Queries Are Built
As a modeler, I want to list the events each query is built `from_events`, so the importer draws Event→Query connectors from the source events to the query.

### US-4: Connect to Events from Other Slices
As a modeler, I want `from_events` to reference events produced in other slices so the importer can prompt me to connect my new query to the existing event shape on the canvas, tying slices together without duplicating events.

### US-5: Get a Fully Connected Slice on Import
As a modeler, I want the imported slice to arrive with all in-slice connectors already drawn (Query→Screen, Screen→Command, Command→Event, Event→Query), so I can review the model immediately instead of wiring it up by hand.

## Functional Requirements

### FR-1: New Top-Level Schema

- **FR-1.1**: The YAML import accepts the following recognized top-level keys: `slice` (required), `screen` (required), `commands` (optional array), `queries` (optional array), `gwt` (optional array).
- **FR-1.2**: A top-level `events` array is no longer accepted. If present in the YAML, the import fails with an inline validation error naming the offending key and pointing to `commands[].produces`.
- **FR-1.3**: The `external` flag on events is no longer part of the schema; there is no user-facing concept of "external events" in imported YAML. If an `external` key appears anywhere the parser previously accepted it, the import fails with an inline validation error.
- **FR-1.4**: Backward compatibility with the previous schema is not provided. Previously-valid YAML that relied on the top-level `events` array must be rewritten to use `produces`/`from_events`.
- **FR-1.5**: Unknown top-level keys or unknown sub-keys (e.g., typos like `screeen`, `produced`, `querys`) other than the removed legacy keys `events` and `external` do NOT fail the import. They are ignored during processing and logged to the plugin console as warnings (e.g., `"YAML import: ignoring unknown key 'screeen' at top level"`). Only `events` and `external` remain hard validation errors under FR-1.2/FR-1.3 because they have an explicit migration path the user needs to see.

### FR-2: `screen` Block

- **FR-2.1**: Every slice YAML must contain a `screen` block. A missing `screen` block fails the import with a clear inline error.
- **FR-2.2**: The `screen` block has these fields:
  - `type` (required): must be exactly `user` or `system`. Any other value, or a missing `type`, fails the import with an inline error.
  - `name` (optional): display label for the shape. Defaults to `"Screen"` when `type: user` and `"Processor"` when `type: system`.
  - `reads` (optional array of strings): names of queries the screen reads from.
  - `executes` (optional array of strings): names of commands the screen executes.
- **FR-2.3**: A slice may declare at most one `screen` block. An array form is not accepted.
- **FR-2.4**: When `type: user`, the importer creates a Screen element (gray placeholder with window icon, as produced by the existing Create Screen feature).
- **FR-2.5**: When `type: system`, the importer creates a Processor element (as produced by the existing Create Processor feature).
- **FR-2.6**: The created shape's label matches the `name` field (or the default based on `type`).
- **FR-2.7**: Every name in `reads` must match the `name` of a query defined in the same slice's `queries` array, using the name-matching rules in FR-8. A non-matching name fails the import with an inline error identifying the unknown query name.
- **FR-2.8**: Every name in `executes` must match the `name` of a command defined in the same slice's `commands` array, using the name-matching rules in FR-8. A non-matching name fails the import with an inline error identifying the unknown command name.
- **FR-2.9**: The screen/processor shape is placed in the reserved top space above the command row of the slice section (the vertical space introduced by FR-2 of the UX Polish Batch). The shape is horizontally centered above the Commands column: its X center equals the horizontal center of the Commands column regardless of how many commands are present.

### FR-3: `commands[].produces`

- **FR-3.1**: Each entry in `commands` may include an optional `produces` field: an array of event names (strings).
- **FR-3.2**: For every name in `produces`, the importer creates a new Event element in the current slice's Events column, regardless of whether an event with the same name already exists in another slice on the canvas. Events produced by commands are always slice-specific.
- **FR-3.3**: The importer draws one Command→Event connector from the command shape to each event it produces.
- **FR-3.4**: An empty or missing `produces` field is valid: no events are auto-created from that command and no Command→Event connectors are drawn for it.
- **FR-3.5**: Existing top-level element fields (`name`, `fields`, `notes`) continue to apply to commands exactly as before.

### FR-4: `queries[].from_events`

- **FR-4.1**: Each entry in `queries` may include an optional `from_events` field: an array of event names (strings).
- **FR-4.2**: For each name in `from_events`, the importer first looks for an event produced by a command in the same slice (i.e. a name appearing in any `commands[].produces` of the current YAML), matched using the rules in FR-8.
  - If a same-slice event with that name exists (either already created or about to be created in this import), the importer draws one Event→Query connector from that event to the query. No modal is shown.
- **FR-4.3**: If no same-slice event matches the name, the importer searches the entire canvas for existing event shapes (elements whose plugin data `type` is `event`) whose label matches under FR-8.
  - If one or more matching event shapes are found on the canvas, the importer displays a modal prompt for that event name. The modal asks: "Connect query `<QueryName>` to existing event `<EventName>`?" and lists each candidate event row with:
    - the candidate event's label,
    - its parent slice's name (read from the Slice section containing the event; shown as "(no slice)" if the event lives outside any Slice section), and
    - a **Focus** button that zooms/pans the FigJam viewport to that candidate event on the canvas so the user can visually confirm before deciding.
  - The user may confirm a candidate (draws an Event→Query connector from the selected event to the new query) or dismiss/cancel the prompt.
  - If the user confirms, the importer draws one Event→Query connector from the chosen canvas event to the newly created query.
  - If the user dismisses or cancels the prompt, no connector is drawn for that event reference. The query itself is still created, and the import continues with the remaining items.
  - Pressing **Focus** does not dismiss the modal; the modal stays open until the user confirms a candidate or cancels.
- **FR-4.4**: If no matching event shape is found anywhere (neither in the current YAML nor on the canvas), the importer shows a modal prompt for that event name asking the user: "No event named `<EventName>` exists. Create it in this slice?" with two actions: **Create event** and **Skip**.
  - If the user chooses **Create event**, the importer creates a new internal event shape (same appearance and default properties as events produced via `commands[].produces` — orange fill `#FF9E42`, orange stroke `#EB7500`, 176×80px) inside the current slice's Events column, using the original YAML spelling as its label (FR-8.4). The importer then draws one Event→Query connector from the new event to the query.
  - If the user chooses **Skip** (or dismisses/cancels the modal), no event is created and no connector is drawn. The query itself is still created, no error is raised, and the import continues.
  - Once the user chooses **Create event** for a given name within a single import, the same name is treated as a same-slice event for any subsequent `from_events` references in later queries of the same import: a connector is drawn silently under FR-4.2 and no second prompt is shown for that name.
- **FR-4.5**: Modal prompts are issued one at a time, in the order the events are encountered during import. A single import may therefore surface multiple prompts in sequence. Modals only appear AFTER all in-slice shapes and all in-slice connectors have been created on the canvas (see FR-9). Cross-slice modals (FR-4.3) are shown before no-match "Create event?" modals (FR-4.4) within the same Phase 4.
- **FR-4.6**: An empty or missing `from_events` field is valid: no Event→Query connectors are drawn for that query.
- **FR-4.7**: Existing top-level element fields (`name`, `fields`, `notes`) continue to apply to queries exactly as before.

### FR-5: Connectors Drawn by the Importer

For every import, the importer draws the following connectors (using the existing FigJam connector style — black curve stroke, consistent with the Connect Elements feature). Direction matters:

- **FR-5.1**: For each name in `screen.reads`, draw one connector from that query shape to the screen/processor shape (Query → Screen).
- **FR-5.2**: For each name in `screen.executes`, draw one connector from the screen/processor shape to that command shape (Screen → Command).
- **FR-5.3**: For each `produces` entry, draw one connector from the command shape to the produced event shape (Command → Event).
- **FR-5.4**: For each resolved `from_events` reference (either same-slice or user-confirmed canvas event), draw one connector from the event shape to the query shape (Event → Query).
- **FR-5.5**: No connectors are drawn to or from Actor elements. Actor shapes are not referenced by the new schema and are unaffected by this feature.
- **FR-5.6**: No connectors are drawn between GWT scenario elements. GWT sections continue to render as today.
- **FR-5.7**: Connector creation uses the same underlying mechanism as the Connect Elements feature to ensure visual and behavioral consistency.

### FR-6: Validation and Error Reporting

- **FR-6.1**: All validation errors introduced by this feature surface through the existing inline error display in the import panel (the mechanism from FR-4 of the UX Polish Batch). No elements are created on the canvas when validation fails.
- **FR-6.2**: Error messages identify the offending field and value, for example: `"Unknown query name in screen.reads: 'ExistingUserByEmail'"`, `"Unknown command name in screen.executes: 'RegisterUser'"`, `"Invalid screen.type 'agent' — expected 'user' or 'system'"`, `"Missing required 'screen' block"`, `"Top-level 'events' is no longer supported; use commands[].produces instead"`, `"Duplicate command name 'RegisterUser' in commands[]"`, `"Duplicate event name 'UserRegistered' in produces of command 'RegisterUser'"`.
- **FR-6.3**: Validation failures are atomic: if any validation check fails, nothing is created on the canvas and no cross-slice modal is shown.
- **FR-6.4**: Cross-slice confirmation modals are only shown after validation has passed and after all in-slice shapes and in-slice connectors have been created (see FR-9).
- **FR-6.5**: Duplicate names within any single list are a validation failure. Specifically, after applying the name-matching rules in FR-8, no two entries within the same list may share the same normalized name:
  - Two entries in `commands[]` with the same `name` → error.
  - Two entries in `queries[]` with the same `name` → error.
  - Two entries in any one command's `produces` with the same value → error.
  - Two entries in any one query's `from_events` with the same value → error.
  - Two entries in `screen.reads` with the same value → error.
  - Two entries in `screen.executes` with the same value → error.
  Cross-list collisions (e.g., a command and a query that happen to share a name) are NOT an error — these are different namespaces.

### FR-7: YAML Template Update

- **FR-7.1**: The YAML template copied to the clipboard via the "Copy YAML template" button is updated to use the new schema, including a `screen` block, a `produces` example on a command, a `from_events` example on a query, and no top-level `events` array.
- **FR-7.2**: The bundled `sample-import.yaml` at the repository root is updated to conform to the new schema.

### FR-8: Name Matching Rules

- **FR-8.1**: All name comparisons introduced by this feature are **case-insensitive and whitespace-normalized**. Specifically, before comparing two names, each name is transformed by:
  1. Trimming leading and trailing whitespace.
  2. Collapsing any internal run of whitespace characters (spaces, tabs, newlines) to a single space.
  3. Lowercasing (using locale-independent ASCII case folding).
  Two names match if and only if their transformed forms are byte-equal.
- **FR-8.2**: Under FR-8.1, these pairs all match each other: `UserRegistered`, `userregistered`, `USER REGISTERED`, `  user  registered  `, `User\tRegistered`.
- **FR-8.3**: Name matching applies to:
  - `screen.reads` entries vs. `queries[].name` (FR-2.7).
  - `screen.executes` entries vs. `commands[].name` (FR-2.8).
  - `queries[].from_events` entries vs. names produced by commands in the current YAML (FR-4.2).
  - `queries[].from_events` entries vs. event shape labels on the canvas when scanning for cross-slice candidates (FR-4.3).
  - Duplicate detection within a single list (FR-6.5).
- **FR-8.4**: The shapes created by the importer use the ORIGINAL spelling from the YAML as their display label (not the normalized form). Matching is normalized; rendering is not.

### FR-9: Import Phase Ordering

The importer executes an import in a fixed phase order so the user sees a fully laid-out slice before being asked any cross-slice questions:

- **FR-9.1**: Phase 1 — Parse & validate. Any validation failure (unknown `screen.type`, unknown names in `reads`/`executes`, duplicates under FR-6.5, legacy `events`/`external`, missing `screen`, etc.) aborts here with an inline error and nothing is drawn on the canvas.
- **FR-9.2**: Phase 2 — Create in-slice shapes. Slice section, screen/processor, commands, events (from `produces`), queries, and GWT sections are created in their final positions.
- **FR-9.3**: Phase 3 — Draw in-slice connectors. Every Query→Screen, Screen→Command, Command→Event, and same-slice Event→Query connector is drawn (the same-slice `from_events` resolutions from FR-4.2).
- **FR-9.4**: Phase 4 — Post-shape prompts. All modals are shown sequentially in this fixed order:
  1. First, for each unresolved `from_events` entry that has one or more canvas-event candidates (FR-4.3), a cross-slice modal is shown. The user confirms a candidate or dismisses. Confirmed entries draw an Event→Query connector from the chosen canvas event; dismissed entries draw nothing.
  2. Then, for each unresolved `from_events` entry with NO candidate anywhere (FR-4.4), a "Create event?" modal is shown. The user chooses Create or Skip. Create spawns an internal event in the current slice's Events column and draws the Event→Query connector; Skip draws nothing and raises no error. Within this import, once the user chooses Create for a given name, subsequent references to the same name silently connect to that new event with no further prompt.
- **FR-9.5**: At the moment each Phase 4 modal appears, the new slice is already visible and selected on the canvas so the user has full visual context.

## User Scenarios & Testing

### Scenario 1: Register User Slice (Happy Path from Brief)
1. User pastes the YAML from the brief (slice: Register User, screen type user, RegisterUser command producing UserRegistered, ExistingUserByEmail query from_events UserRegistered).
2. User clicks Import.
3. A slice section "Register User" is created with:
   - A Screen element labeled "Screen" (or given name) in the top row.
   - A `RegisterUser` command in the Commands column.
   - A `UserRegistered` event in the Events column.
   - An `ExistingUserByEmail` query in the Queries column.
4. Connectors drawn: ExistingUserByEmail → Screen, Screen → RegisterUser, RegisterUser → UserRegistered, UserRegistered → ExistingUserByEmail.
5. No Actor shape is created by the importer, regardless of the slice content.

### Scenario 2: System Processor Slice
1. User imports a slice with `screen.type: system` and `name: "Email Dispatcher"`.
2. A Processor element labeled "Email Dispatcher" is created in the top row above commands.
3. Connectors are drawn the same way as US-1 (Query→Processor, Processor→Command, Command→Event, Event→Query).

### Scenario 3: from_events Matches Existing Canvas Event
1. A previous import already placed a `UserRegistered` event on the canvas in another slice.
2. User imports a new slice whose query has `from_events: [UserRegistered]` and that slice does not itself produce `UserRegistered`.
3. During import, a modal appears: "Connect query `ExistingUserByEmail` to existing event `UserRegistered`?" with the candidate event listed.
4. User confirms. An Event→Query connector is drawn from the existing canvas event to the newly created query.
5. The rest of the slice is created normally.

### Scenario 4: from_events Has Multiple Canvas Candidates
1. Two different slices on the canvas both have `UserRegistered` event shapes.
2. User imports a new slice whose query references `UserRegistered` in `from_events`.
3. The imported slice is fully laid out on the canvas first (Phase 2 + 3). Then the modal appears.
4. The modal lists both candidate events. Each row shows the candidate's label, its parent slice name (e.g. "Register User", "Invite Teammate"), and a **Focus** button.
5. User clicks **Focus** on a candidate; the FigJam viewport zooms/pans to that event. The modal stays open.
6. User confirms the correct candidate. A single Event→Query connector is drawn from the chosen event to the new query.

### Scenario 5: from_events Has No Match — User Creates Event
1. User imports a slice whose query has `from_events: [SomethingThatDoesNotExist]` and no command in the same slice produces that name and no canvas event matches.
2. Phase 2/3 runs: the slice, shapes, and all in-slice connectors are drawn.
3. A "Create event?" modal appears: "No event named `SomethingThatDoesNotExist` exists. Create it in this slice?" with Create / Skip actions.
4. User clicks **Create event**.
5. A new internal (orange) event shape labeled `SomethingThatDoesNotExist` is added to the current slice's Events column, and an Event→Query connector is drawn from the new event to the query.

### Scenario 5b: from_events Has No Match — User Skips
1. Same setup as Scenario 5.
2. The "Create event?" modal appears.
3. User clicks **Skip** (or dismisses the modal).
4. No event is created. No connector is drawn. The query itself is still present on the canvas from Phase 2. Import completes without error.

### Scenario 6: User Dismisses Cross-Slice Prompt
1. User imports a slice with `from_events: [A, B]` where both match canvas events.
2. Modal appears for event `A`. User dismisses.
3. Modal appears for event `B`. User confirms.
4. No connector is drawn for `A`. One Event→Query connector is drawn for `B`. Slice is otherwise created normally.

### Scenario 7: Unknown Query Name in screen.reads
1. User imports a slice where `screen.reads` includes a name not present in `queries`.
2. Import fails with an inline error naming the unknown query.
3. No slice, no shapes, and no connectors are created on the canvas. No modal appears.

### Scenario 8: Missing screen Block
1. User imports a YAML without a `screen` block.
2. Import fails with inline error: "Missing required 'screen' block".
3. Nothing is created on the canvas.

### Scenario 9: Legacy Top-Level events Array
1. User imports a YAML that still uses the previous schema with a top-level `events` array.
2. Import fails with inline error explaining `events` is no longer supported and pointing to `produces`.
3. Nothing is created on the canvas.

### Scenario 10: Command with No produces
1. User imports a slice where a command has no `produces` field (or `produces: []`).
2. The command shape is created normally. No events are auto-created from that command. No Command→Event connectors are drawn for it.

### Scenario 11: Query with No from_events
1. User imports a slice where a query has no `from_events` field.
2. The query shape is created normally. No Event→Query connectors are drawn. No modal is shown.

### Scenario 12: Invalid screen.type
1. User imports a YAML with `screen.type: agent`.
2. Import fails with an inline error naming the invalid value and listing the allowed values (`user`, `system`).

### Scenario 13: Case-Insensitive Name Match
1. User imports a slice where `commands[0].name: "RegisterUser"` and `screen.executes: ["registeruser"]`.
2. The matcher normalizes both to `registeruser` under FR-8 and treats them as the same command.
3. A Screen→Command connector is drawn from the screen to the `RegisterUser` command shape.
4. The command shape is labeled `RegisterUser` (original spelling preserved per FR-8.4).

### Scenario 14: Duplicate Name in `produces`
1. User imports a slice with a command whose `produces: [UserRegistered, UserRegistered]` (or equivalently `[UserRegistered, userregistered]` under the FR-8 matcher).
2. Import fails with an inline error: "Duplicate event name 'UserRegistered' in produces of command 'RegisterUser'".
3. Nothing is created on the canvas.

### Scenario 15: Unknown Key Warning (Not an Error)
1. User imports a YAML that contains a top-level `screeen:` block (misspelled) alongside the correct `screen:` block.
2. Import succeeds normally based on the correct `screen:` block. The misspelled key is ignored.
3. A warning message is logged to the plugin console: `"YAML import: ignoring unknown key 'screeen' at top level"`.
4. No inline UI surfaces the warning — the user only sees it if they open the plugin console.

### Scenario 16: Shapes First, Modal After (Ordering)
1. User imports a slice whose `from_events` references an event that only exists in another slice on the canvas.
2. The new slice is created and laid out (section, screen, commands, events, queries, GWT) with all in-slice connectors drawn.
3. Only AFTER the slice is visible on the canvas does the cross-slice modal appear asking the user to connect to the existing canvas event.
4. If the user dismisses the modal, the slice stays fully rendered; only the single cross-slice connector is missing.

### Scenario 17: Created No-Match Event Reused by Later Query
1. Import a slice with two queries, `QA` and `QB`, both having `from_events: [SharedEvent]`, and no command produces `SharedEvent` and no canvas event matches.
2. Phase 2/3 completes: slice, `QA`, `QB`, commands, screen, and in-slice connectors all drawn.
3. Phase 4: the "Create event?" modal appears for `SharedEvent` (first encountered by `QA`).
4. User clicks **Create event**. An internal event `SharedEvent` is added to the slice's Events column; an Event→Query connector is drawn from `SharedEvent` to `QA`.
5. For `QB`'s same-named reference, no second modal appears. An Event→Query connector is drawn silently from `SharedEvent` to `QB`.

### Scenario 18: Cross-Slice Modal Precedes No-Match Modal
1. Import a slice with two queries: `Q1.from_events: [UserRegistered]` (canvas already has a `UserRegistered` event in another slice) and `Q2.from_events: [Unseen]` (no candidate anywhere).
2. Phase 2/3 completes.
3. Phase 4: the cross-slice modal for `UserRegistered` appears first. User confirms; connector drawn.
4. Then the "Create event?" modal for `Unseen` appears. User clicks Skip; no event created, no connector drawn.
5. Import finishes.

## Success Criteria

- Users can import a YAML that declares a screen, commands with `produces`, and queries with `from_events`, and the resulting slice contains every shape and every in-slice connector correctly drawn without manual wiring.
- Every imported slice is visually complete: at a glance a reviewer can trace the flow Query → Screen → Command → Event → Query purely from the arrows.
- The importer never creates an Event element for a `from_events` reference without the user's explicit confirmation: cross-slice matches require the user to pick a candidate, and no-match references require the user to click "Create event". Dismissing or skipping either modal leaves no trace on the canvas.
- The importer always creates Events declared by `commands[].produces`, so commands never appear without their events in an imported slice.
- When a query's `from_events` name matches an existing canvas event from a prior slice, the user is offered the choice to connect to that event rather than silently duplicating it, so that shared events remain single shapes on the canvas.
- Invalid YAML (unknown `screen.type`, unknown names in `reads`/`executes`, missing `screen`, legacy top-level `events`) never creates partial state on the canvas and always surfaces a specific, actionable inline error message.
- Users with existing YAML files in the old schema see a clear error message that points them to the new `produces` mechanism, rather than a silent partial import.

## Key Entities

- **Slice**: A FigJam section representing one Event Modeling slice. Created from the top-level `slice` field. Contains the screen/processor, commands, events, queries, and GWT scenarios.
- **Screen/Processor**: A single element per slice driven by the `screen` block. Rendered as a Screen shape (`type: user`) or a Processor shape (`type: system`). Reads queries and executes commands.
- **Command**: Unchanged from today except that each command may declare `produces` — a list of event names the command creates in this slice.
- **Event**: Now always slice-specific and always created via `commands[].produces`. No top-level `events` declaration. The same event name may appear on the canvas across multiple slices; the importer does not deduplicate produced events.
- **Query**: Unchanged from today except that each query may declare `from_events` — a list of event names the query is constructed from. Same-slice names resolve to newly-produced events; cross-slice names resolve via a user-confirmation modal against existing canvas events; no-match names trigger a "Create event?" prompt and, if accepted, spawn a new internal event in the current slice.
- **Connector**: A FigJam native connector drawn by the importer using the same style as the Connect Elements feature (black, curve). Directions: Query → Screen, Screen → Command, Command → Event, Event → Query. Actors and GWT elements are never connected by the importer.

## Dependencies

- Existing features modified: `import-from-yaml` (schema, validation, shape/connector creation, template), `create-screen` and `create-processor` (reused for the screen block), `connect-elements` (reused for connector creation, or its underlying connector primitive).
- Existing features relied on unchanged: `create-command`, `create-event`, `create-query`, `create-slice`, `create-gwt`, and the inline import-error display from the UX Polish Batch (FR-4).
- Repository asset: `sample-import.yaml` is updated to the new schema as part of this feature.

## Assumptions

- Actor elements are intentionally out of scope for the importer; the modeler still creates actors manually when they want them on the canvas.
- FigJam's native connector creation (used by Connect Elements) supports programmatic creation with a chosen source and target, which is what the importer needs to draw arrows in specific directions.
- Scanning the canvas for event shapes by plugin data `type === 'event'` and applying the FR-8 name-matching rule is sufficient to find cross-slice candidates; when multiple matches occur the modal's parent-slice label and Focus button let the user disambiguate.
- The YAML import runs on-demand and is not time-critical; showing sequential modals (one per unresolved `from_events`) is acceptable from a UX standpoint.
- FigJam's viewport API supports programmatically zooming/panning to a given node so the Focus button can center a candidate event in view without dismissing the modal.
- Event shapes on the canvas are typically nested inside a Slice section; reading the parent Slice's name for modal disambiguation is reliable. Events outside any Slice section are rare and the modal handles that case by showing "(no slice)".

## Risks

- **Modal fatigue on large imports**: A slice that references many unresolved events (either cross-slice candidates or no-match "Create event?") could trigger many sequential modals. Mitigation: all prompts are skippable (dismiss/Skip = no connector, no event); once a no-match name is created, subsequent same-name references reuse it silently; future work may batch prompts if this becomes painful.
- **Ambiguous canvas matches**: Two unrelated events with the same label can exist on the canvas (e.g. different slices). The modal disambiguates by showing each candidate's parent slice name and a Focus button that zooms the viewport to the candidate. If a user confirms without using Focus and multiple similar candidates exist, they can still pick the wrong event.
- **Aggressive normalization**: FR-8's case-insensitive + whitespace-collapsing matcher means names that look visually distinct (`UserRegistered` vs `user registered` vs `USER REGISTERED`) are treated as the same identifier. This can surprise users who intended them to be different, and it can cause a cross-slice modal to appear for matches the user didn't expect. Mitigation: the modal's Focus button lets the user verify the candidate before confirming; dismissing costs nothing.
- **Schema break for existing users**: Anyone relying on the old `events`/`external` schema will see import failures until they migrate. Mitigation: the error message explicitly points to `produces` and a template copy of the new schema is one click away.
- **Hidden cross-slice coupling**: `from_events` introduces a relationship that depends on the current state of the canvas; the same YAML imported into an empty document vs. a populated one yields different connector outcomes. This is by design but may surprise users.

## Out of Scope

- Creating or connecting Actor elements from YAML.
- Drawing connectors inside GWT sections.
- Automatically creating events in the current slice for `from_events` names that don't match anywhere without user confirmation (a "Create event?" modal is always shown — no silent ghost-event creation).
- Deduplicating events across slices (two slices both producing `UserRegistered` each get their own event shape).
- Batching the cross-slice confirmation modal into a single list; prompts are sequential.
- Migrating existing YAML files automatically to the new schema.
- Updating already-imported slices on the canvas to the new connector layout.
