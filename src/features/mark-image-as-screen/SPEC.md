# Mark Image as Screen

## Type
Action (Panel)

## Description
Mark one or more pasted images on the canvas as Screen elements without altering the image content. A visible border distinguishes screen-marked images from plain images. A revert action restores them.

## User Story
As an event modeler, I want to mark pasted wireframe images as Screens so they participate in the same flows as Screens I create through the plugin.

## Acceptance Criteria
- "Mark as Screen" button is enabled when the current selection includes at least one plain image.
- "Revert to Image" button is enabled when the current selection includes at least one screen-marked image.
- Marking sets `pluginData('type', 'screen')` on every eligible image in the selection.
- Marking applies a visible border (stroke) to the image. The previous stroke state is preserved in plugin data.
- Reverting clears `pluginData('type')`, removes the border, and restores the original stroke state.
- Both actions are idempotent: re-marking is a no-op; reverting a plain image is a no-op.
- Mixed selections process only eligible items.
- "Image" means a node whose `fills` contain a paint with `type === 'IMAGE'`. Shapes/frames that merely have image fills are still eligible by this definition; FigJam's pasted image is a RectangleNode with image fills.

## Technical Notes
- Detection helper: `hasImageFill(node)` checks `'fills' in node` then `fills.some(f => f.type === 'IMAGE')`.
- Sandbox handlers: `handleMarkImagesAsScreen`, `handleRevertScreenImages`.
- Selection-changed payload is enriched with `hasPlainImages` and `hasScreenImages` booleans for both single and multi selection so the UI can enable/disable buttons.
- Original strokes preservation follows the state-management rule: do not overwrite previously-saved originals; delete saved keys after restore.
