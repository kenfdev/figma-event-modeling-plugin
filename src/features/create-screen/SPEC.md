# Create Screen

## Type
Command

## Description
Create gray placeholder box with window icon (image container).

## User Story
As a user, I want to create Screen placeholders where I can later paste UI screenshots.

## Acceptance Criteria
- Clicking "Screen" button creates a new Screen element
- Element appears at viewport center
- Element is a grouped shape containing:
  - Gray rectangle (placeholder)
  - Window icon indicating it's a screen placeholder
  - Default label: "Screen"
- Element stores `type: "screen"` in plugin data
- Images pasted into the Screen are cropped to fit the bounds

## Dependencies
- F0.1: OpenPluginPanel
- F0.2: DetectPlatform

## Technical Notes
- Acts as image container
- Gray box with window icon shown before image is pasted
- Image cropping behavior on paste
