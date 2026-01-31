# Create Lane

## Type
Command

## Description
Create gray lane (half viewport width × 120px) with no label.

## User Story
As a user, I want to create horizontal swimlanes to organize my Event Modeling diagram.

## Acceptance Criteria
- Clicking "Lane" button creates a new Lane element
- Element appears at viewport center
- Element properties:
  - Color: Gray fill (5% opacity, light gray)
  - Shape: Rectangle
  - Width: Half the current viewport width (max 500px)
  - Height: 120px
  - No label by default
- Element stores `type: "lane"` in plugin data
- Multiple clicks create multiple elements (may overlap)

## Dependencies
- F0.1: OpenPluginPanel
- F0.2: DetectPlatform

## Technical Notes
- Plugin creates lanes but does NOT manage swimlane layout
- Users position and organize swimlanes manually
- Width is relative to viewport at creation time, capped at 500px max
- Users can manually resize after creation
