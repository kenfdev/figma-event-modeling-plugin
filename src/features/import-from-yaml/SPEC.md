# Import from YAML

## Type
Command

## Status
Pending

## Description
Read YAML from clipboard, validate, create Slice with elements arranged in columns. GWT sections contain actual colored element shapes (commands, events, queries, errors) placed inside Given/When/Then child sections with auto-resizing layout.

## User Story
As a user, I want to import an Event Model definition from YAML to quickly create elements from a text specification, including fully rendered GWT scenarios with typed element shapes.

## Acceptance Criteria
- "Import from Clipboard" button visible in panel
- Clicking button reads YAML from system clipboard
- YAML is validated and specific errors reported for invalid content
- Valid YAML creates:
  - Slice section with specified name
  - Command elements from `commands` array
  - Event elements from `events` array (with external flag support)
  - Query elements from `queries` array
  - GWT sections from `gwt` array with:
    - Given/When/Then child sections containing actual colored element shapes (not text labels)
    - Each GWT item specifies `name`, `type` (command | event | query | error), and optional `fields`
    - GWT items with `type: error` render as red (fill #FF4444, stroke #CC0000) 176x80px shapes
    - GWT description text rendered as a default yellow sticky note inside the GWT parent section (above Given/When/Then children)
    - Given/When/Then child sections auto-resize to fit their element shapes
    - GWT parent section auto-resizes to fit child sections
    - Elements inside GWT child sections arranged in a grid layout (2 per row, wrapping)
- Elements are arranged in vertical lanes by type (Commands | Events | Queries columns) for top-level elements
- Elements placed at viewport center
- Newly created Slice is automatically selected after import
- Custom fields and notes are imported from YAML (top-level elements only; GWT items support fields but not notes)
- `error` is added to the `ElementType` union as a first-class element type

## Dependencies
- F1.1-F1.3: Command, Event, Query creation
- F5.1: CreateSlice
- F5.2: CreateGWT

## Technical Notes

### YAML Schema
```yaml
slice: Create Roadmap

commands:
  - name: CreateRoadmap
    fields: |
      title: string
      items: array
    notes: Customer checkout flow

events:
  - name: RoadmapCreated
    external: false
    fields: |
      title
      description

queries:
  - name: GetRoadmapStatus
    fields: |
      roadmapId: string

gwt:
  - name: Happy Path
    given: []
    when:
      - name: CreateRoadmap
        type: command
    then:
      - name: RoadmapCreated
        type: event
        fields: |
          title
          description
  - name: Duplicate Title
    description: Roadmaps with exact same title are not allowed. Case-sensitive.
    given:
      - name: RoadmapCreated
        type: event
        fields: |
          title
          description
    when:
      - name: CreateRoadmap
        type: command
    then:
      - name: DuplicateTitleError
        type: error
```

### Breaking Changes from Previous Format
- GWT items change from plain strings to typed objects with `name`, `type`, and optional `fields`
- GWT sections now contain actual colored element shapes instead of text labels in section names
- This is a breaking change; the old GWT format (plain string arrays) is no longer supported

### GWT Item Schema
Each item in `given`, `when`, `then` arrays is an object:
```yaml
- name: ElementName       # Required: element display name
  type: command           # Required: command | event | query | error
  fields: |               # Optional: fields stored as plugin data (string block)
    field1
    field2
```

### GWT Description
- Optional `description` field on GWT entries
- Rendered as a default yellow FigJam sticky note
- Placed inside the GWT parent section, above the Given/When/Then child sections

### GWT Layout
- Given/When/Then child sections auto-resize to fit element shapes
- Elements arranged in a 2-column grid (176px wide elements, wrapping after 2 per row)
- GWT parent section auto-resizes to fit all children

### Error Element Type
- New `ElementType`: `'error'`
- Color: fill #FF4444, stroke #CC0000 (red with darker red stroke)
- Size: 176x80px (same as other elements)
- Only appears inside GWT sections (no top-level `errors` array)
- Stroke weight: 2 (same as other elements)

### Field Precedence
- GWT items use their own `fields` value if specified
- No inheritance from top-level element definitions with matching names

### Validation
- `slice` field is required; others are optional
- GWT items require both `name` and `type` fields
- `type` must be one of: command, event, query, error
- Top-level arrays (`commands`, `events`, `queries`, `gwt`) must be arrays if present
