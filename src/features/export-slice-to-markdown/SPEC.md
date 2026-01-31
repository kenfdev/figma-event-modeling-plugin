# Export Slice to Markdown

## F9.1: ShowExportButton

### Type
Query

### Description
Show Export button only when Slice is selected.

### User Story
As a user, I want to see an Export button when I have a Slice selected so I can export its contents.

### Acceptance Criteria
- Export button is visible in panel only when a Slice is selected
- Export button is hidden when:
  - No element is selected
  - Non-Slice element is selected
  - Multiple elements are selected
- Button is clearly labeled "Export" or "Export to Markdown"

### Dependencies
- F2.1: ViewSelectedElement
- F5.1: CreateSlice

### Technical Notes
- Button placement: In element editor section of panel
- Visual distinction to indicate export action

---

## F9.2: ExportSliceToMarkdown

### Type
Command

### Description
Export Slice contents to Markdown, copy to clipboard, show toast.

### User Story
As a user, I want to export a Slice's contents to Markdown format so I can document or share the Event Model.

### Acceptance Criteria
- Clicking Export copies Markdown to clipboard
- Toast notification shows "Copied to clipboard!"
- Export includes slice name as top-level heading
- Content is grouped by element type:
  - Commands
  - Events
  - Queries
  - GWT sections (with Given/When/Then sub-sections)
- Each element includes:
  - Name
  - Custom fields (if present)
  - Notes (if present)
- Unknown elements (non-plugin shapes) are described generically (e.g., "Rectangle", "Image")
- Empty slices export without error (just the heading)

### Dependencies
- F5.1: CreateSlice
- F9.1: ShowExportButton

### Technical Notes
- Output format:
```markdown
# SliceName

## Commands
- CommandName
  - field1: type
  - Notes: note text

## Events
- EventName

## Queries
- QueryName

## GWT: GWT Section Name
### Given
- items

### When
- items

### Then
- items
```
