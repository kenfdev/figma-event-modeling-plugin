# Spec: Copy Multiple Slices to YAML

## Overview

Extend the existing "Copy to YAML" action so it also handles selections that group several Slices together — either a wrapping section that contains Slices, or a multi-selection of Slice sections on the canvas. The output bundles every Slice's YAML into a single clipboard payload, separated by `---`, in the visual left-to-right order the modeler sees on the canvas. Today, modelers who want to share a chapter, an epic, or any cluster of related slices have to copy each Slice one by one and paste them together manually; this feature removes that friction so a whole group can be captured in a single copy action.

**Target users**: Event-Modeling facilitators and authors who maintain multi-slice diagrams in FigJam and need to export several slices at once for documentation, review, or downstream tooling.

## User Stories

- As a facilitator, I want to select a wrapping section that holds several Slices and copy them all to YAML in a single action, so that I can paste an entire chapter into a doc or PR without exporting each Slice separately.
- As an author, I want to multi-select two or more Slice sections on the canvas and copy them as one YAML payload, so that I can quickly grab an arbitrary cluster of slices that aren't grouped under a parent section.
- As a reviewer, I want the copied YAML to list slices in the order they appear left-to-right on the board, so that the exported sequence matches the temporal flow I read on the canvas.
- As an author, I want non-slice items inside a wrapping section (loose elements, sticky notes, comments, etc.) to be silently ignored, so that the YAML output stays focused on slice content even when the section also contains incidental drawings.

## Functional Requirements

- "Copy to YAML" is available when the selection is a wrapping section whose direct children include one or more Slices.
- "Copy to YAML" is available when the selection is a multi-selection of Slice sections (any count of one or more).
- The single-Slice "Export to YAML" behavior already provided in the panel continues to work unchanged when only one Slice is selected directly.
- The copied payload contains the YAML of every Slice in the selection, concatenated in order.
- Slices are ordered by their absolute horizontal position on the canvas (leftmost first).
- Successive Slice YAML documents are separated by a line containing exactly `---`, the standard YAML document separator.
- Each Slice's YAML matches the format already produced by the existing per-Slice export, so an exported bundle round-trips back through the import flow as a series of slices.
- Non-Slice children of a wrapping section are silently excluded from the output; their presence does not block the copy.
- A wrapping section that contains zero Slices does not offer "Copy to YAML".
- The action emits the same clipboard-success feedback as the existing "Copy to YAML" command (toast confirming the copy).
- Failure cases (selection lost, nothing copyable) surface a clear, single error message and copy nothing.

## Success Metrics

- Modelers can capture a multi-slice group in one action: zero manual concatenation steps required for the common "copy a chapter" workflow.
- Round-trip fidelity: a copied multi-slice payload, when re-imported, reproduces the same set of slices with their elements, fields, and notes intact.
- Slice order in the output matches the left-to-right reading order of the canvas in 100% of selections where slices are arranged horizontally.

## Out of Scope

- Re-ordering, renaming, or editing slices as part of the copy action.
- Copying structural decoration around the slices (lanes, chapters, processors, screens, connectors, free-floating shapes, sticky notes).
- A new top-level wrapper YAML document that names the parent section or chapter; the output is simply a concatenation of per-slice documents.
- Copying nested wrapping sections (a section inside a section); only direct Slice children of the selected wrapping section are considered.
- Drag-and-drop or keyboard-shortcut entry points; the action is invoked from the existing panel button.

## Constraints

- Output format for each slice must remain compatible with the existing import flow so that round-tripping continues to work for both single-slice and multi-slice payloads.
- Clipboard interaction must use the project's existing clipboard helper so the feature works inside the FigJam plugin iframe.
- Deferred: tie-breaking rule when two slices share the same leftmost X coordinate — the simple X-only sort is accepted for now; a secondary criterion (e.g., Y position, or insertion order) can be added later if real-world layouts surface ambiguity.
