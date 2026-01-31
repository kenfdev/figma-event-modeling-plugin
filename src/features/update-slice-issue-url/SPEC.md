# Update Slice Issue URL

## Type
Command

## Description
Edit Issue URL field when Slice selected.

## User Story
As a user, I want to link a Slice to an external issue tracker (Jira, GitHub, etc.) so I can track implementation progress.

## Acceptance Criteria
- Issue URL field shown in panel when Slice is selected
- Field accepts any text (no URL validation per spec)
- URL is stored in plugin data
- Changes persist when Slice is deselected and reselected
- Empty URL is valid (clears the link)

## Dependencies
- F2.1: ViewSelectedElement
- F5.1: CreateSlice

## Technical Notes
- No URL format validation per spec
- See view-slice-issue-marker feature for link icon marker
- See open-slice-issue-url feature for opening URL
