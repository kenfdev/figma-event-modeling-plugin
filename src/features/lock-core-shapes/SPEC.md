# Lock Core Shapes

## Type
Command

## Description
Core shape elements (Command, Event, Query, Actor) are Figma-locked on creation to prevent non-plugin users from accidentally editing shape contents. When the plugin is active and a locked shape is selected, the plugin auto-unlocks it for interaction and re-locks it on deselection. If a user directly edits canvas text so it drifts from plugin data, a red stroke warning appears on the element.

## User Story
As a diagram author, I want my Event Modeling elements to be protected from accidental edits by collaborators who don't have the plugin installed, so the diagram data stays consistent.

## Acceptance Criteria

### Locking on creation
- Newly created Command, Event, Query, and Actor elements have `node.locked = true` set after creation
- Structural elements (Lane, Chapter, Processor, Screen) and Sections (Slice, GWT) are NOT locked
- Existing (previously created) elements are NOT retroactively locked

### Auto-unlock on selection
- When the plugin is active and a locked core shape is selected, the plugin automatically sets `node.locked = false`
- The element editor in the panel works normally while the element is unlocked

### Auto-relock on deselection
- When a previously auto-unlocked core shape is deselected (user clicks elsewhere or selects a different element), the plugin sets `node.locked = true` again
- The plugin tracks which elements it has unlocked so it only re-locks elements it unlocked

### Non-plugin user experience
- Users without the plugin see Figma's standard locked element behavior (cannot interact)
- No additional visual indicator is added for non-plugin users — Figma's built-in lock UI is sufficient

### Drift detection
- On selection of a core shape, the plugin compares the canvas text content with the `label` stored in plugin data
- If the canvas text does not match the plugin data label, the element's stroke color is changed to red as a visual warning
- The original stroke color is saved in plugin data before changing to red
- A `drift-detected` message is sent to the UI with `{ id, drifted: true }` when drift is found, or `{ id, drifted: false }` when no drift
- Drift check runs only on selection (not on every document change) for performance
- Drift check only applies to single-selected core shapes (not structural elements, not multi-selection)
- When a previously drifted element is re-selected without drift, the original stroke color is restored

## Dependencies
- F1.1: CreateCommand
- F1.2: CreateEvent
- F1.3: CreateQuery
- F1.4: CreateActor
- F2.1: ViewSelectedElement

## Technical Notes
- Set `node.locked = true` at the end of each core shape creation handler (create-command, create-event, create-query, create-actor)
- Listen to `figma.on('selectionchange')` in the sandbox to auto-unlock/relock
- Maintain a `Set<string>` of node IDs that were auto-unlocked by the plugin, so we only relock what we unlocked
- Drift detection: compare `node.text.characters` with `node.getPluginData('label')` on selection
- If drift detected: save original stroke RGB as plugin data (`originalStrokeR/G/B`), set red stroke, send `drift-detected` message to the UI
- If no drift and original stroke data exists: restore original stroke color
- Performance: drift check is O(1) per selected element — no scanning of all elements
