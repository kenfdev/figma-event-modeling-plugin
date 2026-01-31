# Create Command

## Type
Command

## Description
Create blue rectangle (176×80px) with "Command" label at viewport center.

## User Story
As a user, I want to click the "Command" button to create a Command element on the canvas.

## Acceptance Criteria
- Clicking "Command" button creates a new Command element
- Element appears at viewport center
- Element is a grouped shape (not Figma component)
- Element properties:
  - Color: Blue (#4A90D9)
  - Shape: Rectangle
  - Size: 176×80px
  - Font size: 16px
  - Default label: "Command"
- Element stores `type: "command"` in plugin data
- Multiple clicks create multiple elements (may overlap)

## Dependencies
- F0.1: OpenPluginPanel
- F0.2: DetectPlatform

## Technical Notes
- Elements are created as grouped shapes
- No overlap detection; user moves elements manually
