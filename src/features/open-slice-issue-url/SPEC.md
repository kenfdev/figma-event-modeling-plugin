# Open Slice Issue URL

## Type
Command

## Description
Click link icon to open URL in browser.

## User Story
As a user, I want to click the link icon on a Slice to quickly navigate to the linked issue tracker.

## Acceptance Criteria
- Clicking the link icon opens the Issue URL in default browser
- Works with any URL format (no validation)
- If URL is malformed, browser handles the error (plugin does not validate)

## Dependencies
- F6.1: UpdateSliceIssueUrl
- F6.2: ViewSliceIssueMarker

## Technical Notes
- Uses Figma's `figma.openExternal()` API or equivalent
- No URL validation per spec
