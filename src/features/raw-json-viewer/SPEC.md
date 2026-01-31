# Raw JSON Viewer

## Type
Query

## Description
A read-only view that displays all plugin data for the selected element as formatted JSON. Accessed via a "Visual / Raw" toggle at the top of the element editor, switching between the normal visual editor and the raw JSON view.

## User Story
As a power user or developer, I want to see the raw plugin data stored on an element so I can debug issues or understand the underlying data model.

## Acceptance Criteria
- When a single element with plugin data is selected, the element editor shows a "Visual / Raw" toggle at the top
- Default mode is "Visual" (the current element editor view)
- Switching to "Raw" mode replaces the element editor contents with a read-only JSON display
- The JSON display shows all plugin data keys and values for the selected element as a single JSON object (e.g., `{ "type": "command", "name": "CreateOrder", "fields": "...", "notes": "...", "fieldsVisible": "false" }`)
- JSON is formatted with indentation for readability
- The JSON view is read-only — no editing allowed
- Switching back to "Visual" returns to the normal element editor
- The toggle is available for all element types that have plugin data (core shapes, structural elements, sections)
- When multiple elements are selected, the toggle is not shown (multi-select keeps current behavior)
- When no element is selected, the toggle is not shown

## Dependencies
- F2.1: ViewSelectedElement

## Technical Notes
- Add a mode state (`'visual' | 'raw'`) to the ElementEditor component
- Render a toggle/segmented control at the top of the editor when a single element with plugin data is selected
- In raw mode, the sandbox sends all plugin data keys for the selected node; the UI renders them as a formatted JSON object in a `<pre>` block
- The sandbox already sends element data on selection — extend the selection response to include all plugin data keys (or add a separate `get-raw-data` message type)
- Use `JSON.stringify(data, null, 2)` for formatting
- Style the JSON display with a monospace font and subtle background to differentiate from the visual editor
- Reset mode to "Visual" when the selection changes (so each new selection starts in visual mode)
