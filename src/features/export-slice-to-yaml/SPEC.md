# Export Slice to YAML

## F15.1: ShowExportToYamlButton

### Type
Query

### Description
Show Export to YAML button only when Slice is selected.

### User Story
As a user, I want to see an Export to YAML button when I have a Slice selected so I can export its contents as YAML.

### Acceptance Criteria
- Export to YAML button is visible in panel only when a Slice is selected
- Export to YAML button is hidden when:
  - No element is selected
  - Non-Slice element is selected
  - Multiple elements are selected
- Button is clearly labeled "Export to YAML"

### Dependencies
- F2.1: ViewSelectedElement
- F5.1: CreateSlice

### Technical Notes
- Button placement: In element editor section of panel, alongside Export to Markdown button

---

## F15.2: ExportSliceToYaml

### Type
Command

### Description
Export Slice contents to YAML format matching the import-from-yaml schema, enabling round-trip (import → export → import).

### User Story
As a user, I want to export a Slice's contents to YAML format so I can save, share, or re-import the Event Model.

### Acceptance Criteria
- Clicking Export to YAML copies YAML to clipboard
- Toast notification shows "Copied to clipboard!"
- Output matches import-from-yaml schema for round-trip compatibility
- Export includes slice name as top-level `slice` field
- Content is grouped by element type: commands, events, queries
- GWT sections with Given/When/Then sub-sections are exported
- Each element includes:
  - Name
  - Custom fields in block string format (if present)
  - Notes (if present)
- Events include `external` flag (only when true, to keep YAML minimal)
- Empty slices export without error (just the slice name)
- Optional keys (fields, notes, external, description) are omitted when empty

### Dependencies
- F5.1: CreateSlice
- F15.1: ShowExportToYamlButton
- F10.1: ImportFromYaml (for round-trip compatibility)

### Technical Notes
- Output format follows `ImportData` interface from import-from-yaml/parser.ts
- Internal storage uses YAML array format for custom fields. Export converts to block string format for import compatibility (reverse of `convertBlockStringToYaml`)
- Use `js-yaml` `yaml.dump()` for serialization
- Use `deserializeFields` from field-utils.ts to parse internal format, then format as `name: type\n` lines
