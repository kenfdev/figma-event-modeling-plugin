# Change Element Type

## Type
Command

## Description
Allow users to convert a Command, Event, or Query element to a different type (Command, Event, or Query) via a dropdown in the element editor. The element's colors update on the canvas while preserving all other data.

## User Story
As a user, I want to change the type of an existing element (e.g., turn a Command into an Event) so I can correct mistakes or adjust my model without deleting and recreating elements.

## Acceptance Criteria
- When a Command, Event, or Query element is selected, the element editor shows a type dropdown instead of a read-only badge
- The dropdown lists three options: Command, Event, Query
- The current type is pre-selected in the dropdown
- Selecting a different type:
  - Updates the element's `type` plugin data
  - Updates the fill color and stroke color on the canvas to match the new type
  - Preserves the element's name, custom fields, notes, and fields visibility state
- If an Event with `external` flag enabled is converted to Command or Query, the external flag is silently cleared and the element uses the standard colors for the new type
- Actor elements do NOT show the type dropdown — they keep the existing read-only type badge
- Structural and section elements are unaffected by this feature

## Dependencies
- F2.1: ViewSelectedElement
- F1.1: CreateCommand (color reference)
- F1.2: CreateEvent (color reference)
- F1.3: CreateQuery (color reference)

## Technical Notes
- Replace the type badge with a `<select>` dropdown for Command/Event/Query elements in ElementEditor
- Color constants should be extracted into a shared location (or imported from each handler) so the change-type handler can apply the correct colors:
  - Command: fill `#3DADFF`, stroke `#007AD2`
  - Event (internal): fill `#FF9E42`, stroke `#EB7500`
  - Event (external): fill `#9B59B6`, stroke (purple variant)
  - Query: fill `#7ED321`, stroke `#5BA518`
- The sandbox handler receives a `change-element-type` message with `{ id, newType }` and updates:
  1. `node.setPluginData('type', newType)`
  2. `shape.fills` and `shape.strokes` to the new type's colors
  3. If converting away from Event, clear `external` plugin data
- Text color remains white across all types
- Element size (176x80px) does not change on type conversion
