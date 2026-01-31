# Update Notes

## Type
Command

## Description
User edits notes textarea for Command/Event/Query elements.

## User Story
As a user, I want to add notes to Command, Event, and Query elements to provide additional context.

## Acceptance Criteria
- Notes textarea shown for Command, Event, and Query elements
- Textarea accepts free-form text with no character limit
- Notes are stored in plugin data
- Changes persist when element is deselected and reselected
- Actor elements do NOT show notes field

## Dependencies
- F2.1: ViewSelectedElement
- F1.1, F1.2, F1.3: Command, Event, Query elements

## Technical Notes
- Notes are separate from custom fields
- Unlimited character length per spec
