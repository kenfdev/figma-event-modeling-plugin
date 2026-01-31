# Duplicate Element

## Type
Command

## Description
Duplicate selected element with all plugin data, offset from original.

## User Story
As a user, I want to duplicate an element to quickly create similar elements with the same data.

## Acceptance Criteria
- Duplicate button shown in element editor for elements with custom fields (Command, Event, Query)
- Clicking Duplicate creates a copy of the selected element
- All plugin data is copied:
  - type
  - name
  - custom fields
  - notes
  - visibility settings
  - external flag (for Events)
- Duplicated element is offset from original (not directly on top)
- Duplicated element is selected after creation

## Dependencies
- F2.1: ViewSelectedElement
- F3.2: UpdateCustomFields

## Technical Notes
- Offset amount should be reasonable (e.g., 20-50px)
- Similar to native Figma duplicate but ensures plugin data is preserved
