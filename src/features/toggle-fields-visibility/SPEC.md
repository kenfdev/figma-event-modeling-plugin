# Toggle Fields Visibility

## Type
Command

## Description
Show/hide custom fields on selected element; resize element accordingly.

## User Story
As a user, I want to show or hide the custom fields section on an element to control how much detail is visible on the canvas.

## Acceptance Criteria
- Toggle/checkbox shown in element editor for Command/Event/Query
- When enabled: Custom fields section is visible on the canvas element
- When disabled: Custom fields section is hidden on the canvas element
- Element shrinks when fields hidden, expands when shown
- Field data is retained when hidden (only visibility changes)
- Toggle state is per-element (not global)
- Default state: fields hidden

## Dependencies
- F2.1: ViewSelectedElement
- F3.2: UpdateCustomFields

## Technical Notes
- Scope: Selected elements only (not global toggle)
- Data retention: Fields data preserved when hidden
- Element resizing should be smooth
