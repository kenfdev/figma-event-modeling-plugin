# Spec: Mark Image as Screen

## Overview

Event Modeling diagrams often need Screen elements that represent UI mockups or wireframes. Today users frequently paste raw images onto the canvas to stand in for screens, but the plugin has no way to recognize those images as Screens, so they are excluded from selection metadata, exports, and any other Screen-aware behavior. This feature lets a user mark an existing pasted image as a Screen in-place, attaching the same metadata a Screen element carries while preserving the image itself, and gives the image a clear visual cue so collaborators can tell at a glance that it represents a Screen.

**Target users**: Event modelers (product designers, engineers, facilitators) who paste wireframe or mockup images directly into FigJam while building out a model.

## User Stories

- As an event modeler, I want to mark a pasted wireframe image as a Screen, so that it participates in the same flows as Screens I create through the plugin.
- As an event modeler, I want a screen-marked image to look visibly different from a plain image on the canvas, so that I and my collaborators can immediately tell it represents a Screen.
- As an event modeler, I want to mark several pasted images as Screens at once, so that I can convert a batch of wireframes without repeating the action one by one.
- As an event modeler, I want to revert a screen-marked image back to a plain image, so that I can undo the change without redoing my paste and layout.
- As an event modeler, I want a screen-marked image to appear in slice exports alongside other Screens, so that downstream artifacts include the wireframes I've pasted.

## Functional Requirements

- When a user has one or more images selected on the canvas, the plugin panel offers an action that marks every selected image as a Screen.
- When no image is selected, the action is unavailable or clearly inactive so users understand it requires an image selection.
- Marking an image as a Screen attaches Screen metadata to the image itself without converting, replacing, cropping, resizing, or otherwise altering the underlying image content.
- A screen-marked image is visually distinguished from a plain image by applying a visible border to the image, so it can be recognized as a Screen at any reasonable zoom level.
- A screen-marked image behaves as a full Screen elsewhere in the plugin: it is recognized in the selection panel as a Screen, its name and other Screen-applicable fields are editable, and it is included in any plugin behavior that operates on Screens (such as exports and connector handling).
- The plugin panel offers a revert action that removes the Screen metadata and the visual distinction, restoring the image to a plain image.
- Marking and reverting both work on multiple selected items in a single action; mixed selections (e.g., images plus non-images) process the eligible items and ignore the rest.
- The action is restricted to image nodes; nodes that merely contain or display an image (such as shapes or frames with image fills) are not eligible.
- The action is idempotent: re-marking an already-marked image is a no-op, and reverting a plain image is a no-op.

## Success Metrics

- Users who paste a wireframe image and want it treated as a Screen can do so without re-creating or replacing the image.
- Slice exports run on a slice containing screen-marked images include those images as Screens at the same rate as Screens created via the existing Screen action.
- Users can visually identify a screen-marked image versus a plain image on the canvas at typical working zoom levels.
- The action is discoverable from the plugin panel within the first selection of an image, without requiring documentation.

## Out of Scope

- Automatically detecting pasted images and marking them as Screens without explicit user action.
- Marking shapes, frames, or other non-image nodes that contain an image fill.
- Converting the image into a separate Screen container shape, replacing the image, or cropping/resizing the image to fit Screen dimensions.
- Editing or styling the image itself (filters, masks, replacement) as part of this feature.
- Producing a different default name for the image based on filename or image content.

## Constraints

- The visual distinction relies on FigJam's native image border capability; no custom border element is introduced for this purpose.
- The metadata attached to a screen-marked image must be compatible with the existing Screen element handling so that selection, exports, and other Screen-aware features work without per-feature special cases.
- Reverting must fully remove both the Screen metadata and the applied border so that the image is indistinguishable from one that was never marked.
