# Toggle Event Type

## Type
Command

## Status
Pending

## Description
Toggle Event between internal (orange) and external (purple).

## User Story
As a user, I want to mark an Event as internal or external to distinguish between events within my system and events from external systems.

## Acceptance Criteria
- Toggle/switch shown only for Event elements
- Internal (default): Orange (#FF9E42)
- External: Purple (#9B59B6)
- Toggling changes the element's fill color on canvas
- Toggle state is persisted in plugin data (`external: true/false`)
- Newly created Events default to internal

## Dependencies
- F2.1: ViewSelectedElement
- F1.2: CreateEvent

## Technical Notes
- Only Event elements have this toggle
- Color change is immediate and visual
