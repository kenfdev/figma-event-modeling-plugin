# F16.3: Connect Elements

## Type
Command

## Description
Create a FigJam native connector between two selected elements with black curve stroke.

## User Story
As a user, I want to connect two elements with a visual connector to show relationships between them in my Event Model diagram.

## Acceptance Criteria
- Connect button appears in the plugin panel only when exactly 2 elements are selected
- Clicking Connect creates a FigJam native connector between the two selected elements
- Connector goes from the first selected element (source) to the second selected element (target)
- Connector uses "curve" stroke style
- Connector color is black
- Works for any two connectable shapes on the canvas — plugin elements, native FigJam shapes, stickies, etc
- Selection is not changed after creating the connector — both elements remain selected
- Multiple connectors between the same pair of elements are allowed

## Dependencies
- F2.2: ViewMultipleSelected

## Technical Notes
- FigJam connector API: Use Figma's connector creation methods
- CURVE line type for stroke style
- Black stroke color
- Selection order determines connector direction (first selected = source, second = target)
