# Tasks: Copy Multiple Slices to YAML

Spec: [.ai-tmp/20260504161910-copy-multi-slice-yaml/spec.md](.ai-tmp/20260504161910-copy-multi-slice-yaml/spec.md)

---

## T001 — Copy a wrapping section's slices to YAML

- **User Story**: As a facilitator, I want to select a wrapping section that holds several Slices and copy them all to YAML in a single action, so that I can paste an entire chapter into a doc or PR without exporting each Slice separately.
- **Spec**: [.ai-tmp/20260504161910-copy-multi-slice-yaml/spec.md#user-stories](.ai-tmp/20260504161910-copy-multi-slice-yaml/spec.md#user-stories)
- **Goal**: When a wrapping section that contains one or more Slices is selected, the existing "Copy to YAML" action becomes available and copies a single payload containing every contained Slice's YAML, in left-to-right canvas order, separated by `---`. Non-slice children are silently ignored.
- **Scope**:
  - In: Surfacing the "Copy to YAML" action for a wrapping-section selection that has at least one Slice child.
  - In: Bundling each Slice's YAML in left-to-right order with `---` separators between documents.
  - In: Silently excluding non-Slice children from the output.
  - In: Same toast / clipboard feedback as the existing single-element Copy to YAML.
  - Out: Multi-selection of Slices on the canvas (T002).
  - Out: Re-ordering, renaming, or editing slices; copying lanes/chapters/processors/screens or other non-slice content; nested wrapping sections.
- **Dependencies**: depends_on: []
- **Acceptance signals**:
  - With a wrapping section selected that contains 3 Slices arranged left-to-right, the user clicks Copy to YAML and the clipboard holds the 3 Slices' YAML in left-to-right order, separated by `---`.
  - The same action on a wrapping section that contains exactly 1 Slice produces that Slice's YAML alone (no `---` separator).
  - A wrapping section that contains 0 Slices does not show the Copy to YAML action.
  - Non-Slice content placed inside the wrapping section (sticky notes, free shapes, lanes) does not appear in the copied output and does not block the copy.
  - Re-importing the copied multi-slice payload reproduces the same set of slices with their elements, fields, and notes intact.
  - The existing single-Slice "Export to YAML" panel button continues to work unchanged.
- **Size**: M

---

## T002 — Copy a multi-selection of slices to YAML

- **User Story**: As an author, I want to multi-select two or more Slice sections on the canvas and copy them as one YAML payload, so that I can quickly grab an arbitrary cluster of slices that aren't grouped under a parent section.
- **Spec**: [.ai-tmp/20260504161910-copy-multi-slice-yaml/spec.md#user-stories](.ai-tmp/20260504161910-copy-multi-slice-yaml/spec.md#user-stories)
- **Goal**: When the user multi-selects two or more Slice sections directly on the canvas, the "Copy to YAML" action becomes available in the panel and copies a single payload containing every selected Slice's YAML, in left-to-right canvas order, separated by `---`.
- **Scope**:
  - In: Surfacing the "Copy to YAML" action when the selection is 2+ Slice sections.
  - In: Bundling selected Slices' YAML in left-to-right order with `---` separators.
  - In: Same toast / clipboard feedback as the existing single-element Copy to YAML.
  - Out: Wrapping-section selection (T001).
  - Out: Mixed selections that include non-Slice elements alongside slices; the action does not appear for those.
  - Out: Single-Slice selection, which continues to use the existing per-Slice export.
- **Dependencies**: depends_on: [T001]
- **Acceptance signals**:
  - With 3 Slices multi-selected on the canvas left-to-right, clicking Copy to YAML places a payload on the clipboard containing the 3 Slices' YAML in left-to-right order separated by `---`.
  - With 2 Slices multi-selected, the payload contains both Slices' YAML separated by a single `---`.
  - A multi-selection that mixes Slices with non-Slice elements does not offer the Copy to YAML action (or offers it only when all selected items are Slices).
  - Selecting a single Slice continues to behave as today (existing per-Slice "Export to YAML" path).
  - Re-importing a copied multi-selection payload reproduces the same set of slices.
- **Size**: S
