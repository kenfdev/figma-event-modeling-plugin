# Tasks: Mark Image as Screen

Spec: [specs/20260514091106-mark-image-as-screen/spec.md](specs/20260514091106-mark-image-as-screen/spec.md)

---

## T001 — Mark and revert images as Screen

- **User Story**: As an event modeler, I want to mark one or more pasted wireframe images as Screens — and revert them back to plain images — so that pasted wireframes participate in the same flows as Screens I create through the plugin, and so that I can undo the mark without redoing my paste and layout.
- **Spec**: [specs/20260514091106-mark-image-as-screen/spec.md#user-stories](specs/20260514091106-mark-image-as-screen/spec.md#user-stories)
- **Goal**: An event modeler can select one or more pasted images on the canvas and trigger a single panel action to mark every eligible image as a Screen, and can later select one or more screen-marked images and trigger a revert action to restore them to plain images. Each marked image gains a clear visible border and is treated as a full Screen by selection metadata, name editing, exports, and other Screen-aware behavior — without altering the image content itself. Revert fully removes both the metadata and the border.
- **Scope**:
  - In: Plugin panel action that marks the current image selection as Screen.
  - In: Plugin panel action that reverts a selection of screen-marked images to plain images.
  - In: Visual distinction via a native image border applied on marking and removed on revert.
  - In: Attach Screen metadata on marking so the image is recognized as a Screen by existing Screen-aware features (selection panel, exports, connector handling, name editing); remove the metadata on revert.
  - In: Batch behavior for both actions — each action processes every eligible item in the selection in one invocation; mixed selections process eligible items and ignore the rest.
  - In: Idempotent behavior — re-marking an already-marked image is a no-op; reverting a plain image is a no-op.
  - In: Each action is unavailable or clearly inactive when no eligible item is selected.
  - Out: Automatic detection of pasted images as Screens without explicit user action.
  - Out: Marking shapes, frames, or other non-image nodes that merely contain an image fill.
  - Out: Editing or styling the image content (filters, masks, crop, resize, replacement).
  - Out: Deriving a default Screen name from filename or image content.
- **Dependencies**: depends_on: []
- **Acceptance signals**:
  - With one or more pasted images selected, the user can invoke a "Mark as Screen" action from the plugin panel and every eligible image becomes a Screen in one step.
  - A screen-marked image shows a visible border at typical working zoom levels, distinguishing it from a plain image.
  - With one or more screen-marked images selected, the user can invoke a revert action from the plugin panel and every eligible image becomes a plain image in one step; after revert, the image has no border and is no longer recognized as a Screen anywhere in the plugin.
  - Each action is visibly unavailable or inactive when there is no eligible item in the current selection.
  - A screen-marked image appears in the selection panel as a Screen and its Screen-applicable fields (e.g. name) are editable there.
  - Running a slice export on a slice containing a screen-marked image includes that image as a Screen, alongside Screens created via the existing Screen action.
  - Re-invoking mark on an already-marked image, or revert on a plain image, leaves the node unchanged.
  - Each action invoked on a mixed selection processes only the eligible items and leaves other nodes untouched.
- **Size**: M
