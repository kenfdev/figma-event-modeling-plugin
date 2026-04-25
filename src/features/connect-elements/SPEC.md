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
- Connector direction follows the Event Modeling chain when both selections are direct chain neighbors: `event → query → screen → command → event` (cyclic). When the chain dictates a direction, that direction is used regardless of selection order.
- Processor elements are treated as `screen` for chain ordering (same role in the model).
- For pairs not adjacent in the chain (e.g., actor + anything, event + screen, same-type pairs, native shapes/stickies without plugin type), the connector direction follows selection order: first selected = source, second = target.
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
- Chain-based direction is implemented in `src/shared/figma/connectors.ts::createConnector` by reading `getPluginData('type')` on each endpoint. When the two types are direct neighbors in the chain, the source/target (and their magnets) are swapped if needed; otherwise the caller-provided order is preserved.
