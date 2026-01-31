# Feature: Detect Drift

## Overview

Detects when a core element's canvas text has been manually edited and no longer matches the plugin data label. Provides visual feedback (red stroke) and the ability to sync (restore) the original label.

## Acceptance Criteria

- When a single core element (command, event, query, actor) is selected, compare its canvas text to its plugin data label.
- If they differ, send a `drift-detected` message with `drifted: true` and change the element's stroke to red.
- If they match, send `drift-detected` with `drifted: false` and restore the original stroke color if previously saved.
- Save the original stroke color in plugin data before changing to red (do not overwrite if already saved).
- On `sync-drift` message, restore the canvas text to the plugin data label, restore the original stroke color, clean up saved stroke data, and send `drift-detected` with `drifted: false`.
- Do not check drift for non-core element types (lane, chapter, etc.) or non-plugin elements.
- Do not check drift when zero or multiple elements are selected.

## Technical Notes

- `handleSelectionForDrift` is a standalone exported function called on selection change.
- `handleSyncDrift` is a message handler registered for the `sync-drift` message type.
- Core element types: command, event, query, actor.
- Original stroke color is stored in plugin data keys: `originalStrokeR`, `originalStrokeG`, `originalStrokeB`.
