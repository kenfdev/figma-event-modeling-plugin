# UX Polish Batch

## Overview

A collection of five targeted improvements to the FigJam Event Modeling plugin: fixing element shape type to prevent rounding on resize, increasing top margin in imported slices, fixing issue link marker visibility, adding inline error feedback for YAML import failures, and moving the import feature from the settings panel to the main panel.

## Clarifications

### Session 2026-04-03

- Q: What's wrong with ROUNDED_RECTANGLE at cornerRadius=0? → A: Shape looks fine initially but reverts to rounded corners when user resizes. Switching to SQUARE shape type fixes this.
- Q: What does "more top margin for imported slice" mean? → A: The RESERVED_TOP_SPACE (currently 240px) above the command row is not enough for placing screen/processor elements above. Needs to be increased.
- Q: Where exactly is the issue link marker hidden? → A: The marker emoji is placed at y=8 inside the section, which is behind the FigJam section title bar. Needs more Y offset (~40-50px).
- Q: How should YAML import errors be displayed? → A: Inline error message below/near the YAML textarea. Error clears on successful import.
- Q: Should import move to main panel? → A: Yes, place it under the Sections area and above the selected element area. Remove from settings panel entirely.
- Q: Should the import section in the main panel be collapsible or always visible? → A: Collapsible, collapsed by default. User clicks to expand.
- Q: Should existing markers be repositioned when the user updates the URL? → A: No, only newly created markers get the corrected Y position. Existing markers stay where they are.
- Q: Should YAML import error messages be localized via i18n? → A: No, English-only. Error messages are technical and don't need translation.
- Q: What label for the collapsible import section header? → A: "Other".

## Problem Statement

Users encounter several friction points with the current plugin experience: elements created as ROUNDED_RECTANGLE shapes lose their sharp corners when manually resized; imported slices don't leave enough vertical space above the command row for screen/processor elements; the issue link marker on slices is hidden behind the FigJam section title bar; invalid YAML imports fail silently with no feedback; and the import feature is buried in the settings panel instead of being readily accessible in the main panel.

## User Stories

### US-1: Sharp-Cornered Elements on Resize
As a user, I want elements to maintain sharp corners when I resize them so my diagram looks consistent and professional.

### US-2: Adequate Space Above Imported Elements
As a user, I want more vertical space above commands/queries in imported slices so I can place screen and processor elements above them without overlapping.

### US-3: Visible Issue Link Marker
As a user, I want to see the issue link marker on my slices so I can click it to navigate to the linked issue.

### US-4: YAML Import Error Feedback
As a user, I want to see clear error messages when my YAML import fails so I can identify and fix the problem.

### US-5: Import Accessible from Main Panel
As a user, I want to access the YAML import feature directly from the main panel so I don't have to navigate to settings for a frequently used action.

## Functional Requirements

### FR-1: Use SQUARE Shape Type for Core Elements

- **FR-1.1**: All core element shapes (command, event, query, actor) are created using `shapeType = 'SQUARE'` instead of `shapeType = 'ROUNDED_RECTANGLE'`.
- **FR-1.2**: Elements retain their existing dimensions (176x80px), colors, stroke, and text styling — only the shape type changes.
- **FR-1.3**: The shape type change applies to both individually created elements (via panel buttons) and elements created during YAML import.
- **FR-1.4**: Elements created inside GWT sections during import also use the SQUARE shape type.
- **FR-1.5**: The `cornerRadius` property is no longer set on created shapes (not needed for SQUARE type).
- **FR-1.6**: Existing elements already on the canvas are not modified — only newly created elements use the new shape type.

### FR-2: Increase Top Margin for Imported Slices

- **FR-2.1**: The reserved vertical space above the command/query row in imported slices is increased from the current value to provide more room for screen and processor elements.
- **FR-2.2**: The increased space applies only to slices imported via the YAML import feature.
- **FR-2.3**: The overall slice section auto-sizes to fit all children including the increased top space.
- **FR-2.4**: Element positioning within the slice (commands, events, queries, GWT) adjusts relative to the new top margin.

### FR-3: Fix Issue Link Marker Positioning

- **FR-3.1**: The issue link marker (link emoji) is positioned with sufficient Y offset to clear the FigJam section title bar.
- **FR-3.2**: The marker remains in the top-left area of the section but is visible below the title bar.
- **FR-3.3**: Only newly created markers use the corrected position. Existing markers retain their current position when the URL is updated.
- **FR-3.4**: The X position of the marker remains at 8px.

### FR-4: Inline YAML Import Error Display

- **FR-4.1**: When a YAML import fails (invalid syntax, missing required fields, structural errors), an error message is displayed inline near the YAML input textarea.
- **FR-4.2**: The error message shows the specific error text returned by the parser (e.g., "Invalid YAML syntax", "Missing required 'slice' field"). Error messages are English-only (not localized via i18n).
- **FR-4.3**: The error message is visually distinct (e.g., red text or red-bordered area) to clearly indicate a failure.
- **FR-4.4**: When a subsequent import succeeds, the error message is cleared.
- **FR-4.5**: The error message is cleared when the user starts editing the YAML textarea content.

### FR-5: Move Import to Main Panel

- **FR-5.1**: The YAML import feature (textarea, import button, template) appears in the main panel, positioned below the Sections area and above the selected element area.
- **FR-5.2**: The import section is collapsible and collapsed by default, under the header label "Other". User clicks the header to expand it, revealing the textarea and import button.
- **FR-5.3**: The import feature is removed from the settings panel entirely.
- **FR-5.4**: The import UI includes the same textarea, import button, and YAML template functionality as the current settings panel implementation.
- **FR-5.5**: The inline error display (FR-4) is integrated into the main panel import section.

## User Scenarios & Testing

### Scenario 1: Create and Resize a Command
1. User clicks "Command" in the plugin panel
2. A blue 176x80px sharp-cornered rectangle appears on the canvas
3. User drags a corner to resize the element
4. The element maintains sharp corners after resize — no rounding occurs

### Scenario 2: Import Slice with Space for Screens
1. User pastes valid YAML with a slice containing commands and events
2. User clicks Import
3. A slice section is created with elements laid out inside
4. There is ample vertical space above the command row for the user to manually place screen or processor elements

### Scenario 3: Issue Link Visible on Slice
1. User selects a slice element
2. User enters an issue URL in the plugin panel
3. A link emoji marker appears on the slice, clearly visible below the section title bar
4. User can click the marker to open the linked URL

### Scenario 4: Invalid YAML Shows Error
1. User types invalid YAML (e.g., missing colon, bad indentation) into the import textarea
2. User clicks Import
3. An error message appears inline near the textarea: "Invalid YAML syntax"
4. No elements are created on the canvas
5. User fixes the YAML and clicks Import again
6. The error message disappears and the slice is imported successfully

### Scenario 5: Missing Slice Field Shows Error
1. User pastes YAML without a `slice` field
2. User clicks Import
3. Error message shows: "Missing required 'slice' field"
4. User adds the slice field and re-imports successfully

### Scenario 6: Import from Main Panel
1. User opens the plugin panel
2. Below the Sections area, the user sees the YAML import textarea and button
3. User pastes YAML and clicks Import
4. The slice is created on the canvas
5. No import option exists in the settings panel

### Scenario 7: Error Clears on Edit
1. User imports invalid YAML and sees the inline error
2. User starts typing in the textarea to fix the YAML
3. The error message clears as soon as the user edits

## Success Criteria

- Elements maintain sharp corners when resized by users, matching the appearance of standard rectangles
- Imported slices provide enough vertical space above the command row for users to place screen and processor elements without overlap
- Issue link markers on slices are fully visible and clickable without being obscured by the section title
- Users receive immediate, specific feedback when YAML import fails, enabling them to self-diagnose and fix issues
- The YAML import feature is accessible directly from the main panel without navigating to settings
- All existing element creation and import functionality continues to work correctly after the shape type change

## Dependencies

- Existing features modified: create-command, create-event, create-query, create-actor (shape type), import-from-yaml (shape type + top margin), update-slice-issue-url (marker position), open-plugin-panel (Panel UI restructure)
- FigJam platform: SQUARE shape type availability and behavior

## Assumptions

- FigJam's SQUARE shape type supports custom dimensions (not locked to 1:1 aspect ratio) — if it enforces square aspect ratio, an alternative non-rounding shape type will be needed
- The FigJam section title bar height is approximately 30-40px, so a marker Y offset of ~40-50px will clear it
- Moving the import UI to the main panel does not significantly increase the panel's visual complexity

## Risks

- **SQUARE shape type constraints**: FigJam's SQUARE shape type may enforce 1:1 aspect ratio, preventing the 176x80px dimensions used for core elements. Mitigation: verify during implementation; if constrained, investigate alternative shape types that don't round on resize.
- **Section title bar height variation**: The FigJam section title bar height may vary based on title text length or zoom level. Mitigation: use a generous offset and test at various zoom levels.

## Out of Scope

- Migrating existing elements on the canvas to the new shape type
- Fixing marker position on existing slices that already have markers (only new/updated markers)
- Adding success toast for YAML import (only error feedback is in scope)
- Redesigning the overall panel layout beyond moving the import section
