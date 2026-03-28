# F16.4: Copy Element to YAML

## Type
Command

## Description
Copy a selected element or section to YAML format in the system clipboard.

## User Story
As a user, I want to copy an element's data as YAML so I can easily share or re-use element definitions.

## Acceptance Criteria
- "Copy to YAML" button appears in the plugin panel when a single core shape (command, event, query, actor) or section (slice, GWT) is selected
- For core shapes, clicking the button copies YAML in this minimal flat format:
  ```
  name: PlaceOrder
  type: command
  fields:
    - userId: string
    - amount: number
  ```
- The `name` field is the element's label; the `type` field is the element type (command, event, query, actor)
- For events, an `external: true` field is included when the event is external type
- The `fields` key is only present when the element has custom fields; elements without custom fields omit the `fields` key entirely
- The `notes` key is included when the element has notes content
- For Slice elements, the existing Export to YAML functionality (FR-15.2) is reused — the button label matches the existing "Export to YAML" button
- For GWT sections, the YAML follows the structured format with given/when/then sections, each containing elements with name, type, and optional fields
- YAML is copied to the system clipboard with a toast notification confirming "Copied to clipboard!"
- Copy to YAML button is not shown for structural elements (lane, chapter, processor) or Screen elements

## Dependencies
- F2.1: ViewSelectedElement
- F15.2: ExportSliceToYaml (reused for slices)

## Technical Notes
- Use `js-yaml` for YAML serialization
- Flat YAML format for core shapes
- GWT sections use nested structure with given/when/then
