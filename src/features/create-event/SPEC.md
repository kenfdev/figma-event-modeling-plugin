# Create Event

## Type
Command

## Description
Create orange rectangle (176×80px) with "Event" label at viewport center.

## User Story
As a user, I want to click the "Event" button to create an Event element on the canvas.

## Acceptance Criteria
- Clicking "Event" button creates a new Event element
- Element appears at viewport center
- Element is a grouped shape (not Figma component)
- Element properties:
  - Color: Orange (#FF9E42) - internal event default
  - Shape: Rectangle
  - Size: 176×80px
  - Font size: 16px
  - Default label: "Event"
- Element stores `type: "event"` in plugin data
- Element stores `external: false` in plugin data (internal by default)
- Multiple clicks create multiple elements (may overlap)

## Dependencies
- F0.1: OpenPluginPanel
- F0.2: DetectPlatform

## Technical Notes
- Events have internal/external toggle (see toggle-event-type feature)
- Internal: Orange (#FF9E42)
- External: Purple (#9B59B6)
