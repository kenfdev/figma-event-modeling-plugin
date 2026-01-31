# Create Slice

## Type
Command

## Description
Create FigJam section for vertical slice.

## User Story
As a user, I want to create Slice sections to represent vertical slices of functionality in my Event Model.

## Acceptance Criteria
- Clicking "Slice" button creates a new Slice element
- Element appears at viewport center
- Element is a FigJam native section
- Element properties:
  - Default name: "Slice"
- Element stores `type: "slice"` in plugin data
- Section can contain other plugin elements

## Dependencies
- F0.1: OpenPluginPanel
- F0.2: DetectPlatform

## Technical Notes
- Uses FigJam native section API
- Slices can contain Issue URLs (see update-slice-issue-url feature)
- Export operates on Slice contents (see export-slice-to-markdown feature)
