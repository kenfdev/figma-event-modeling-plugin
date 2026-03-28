# Element Data Model Redesign

## Overview

A coordinated enhancement to the plugin's element data model that eliminates text/data drift, restructures custom fields with a proper UI, removes obsolete features, and improves the Screen element as an image placeholder. These changes simplify the user experience by establishing clear data ownership: canvas text is always the element name (single source of truth), custom fields live exclusively in plugin data with a structured UI, and features that caused confusion (Show Fields, Detect Drift) are removed entirely.

## Clarifications

### Session 2026-03-28

- Q: Should the import-from-yaml YAML schema adopt the new array format for fields, or keep the block string format? → A: Keep import YAML format as-is (block string); convert to new storage format internally during import.
- Q: Should users be able to reorder custom field rows? → A: Yes, via up/down arrow buttons on each row (not drag-and-drop).
- Q: When should custom field changes be persisted to plugin data? → A: On blur (when the input loses focus).
- Q: Should the export-to-markdown output format change? → A: Same markdown output; only internal parsing updates for new storage format.
- Q: Should Export to YAML be in this spec or separate? → A: Include in this spec as FR-6.
- Q: What scope should Export to YAML cover? → A: Mirror the import YAML format; export a selected Slice to the same schema used by import-from-yaml (round-trip compatible).
- Q: What layout for custom field rows in the narrow plugin panel? → A: Inline compact — all controls on one row: [Name] [Type] [↑][↓][×].
- Q: How should Export to YAML handle GWT sections? → A: Inspect nested sections — walk Slice → GWT sections → Given/When/Then children to reconstruct GWT arrays.

## Problem Statement

Users experience a critical issue where element names and custom field data become out of sync ("drift"). The root cause is the Show Fields feature, which concatenates field data into the canvas shape text, breaking the assumption that shape text equals the element name. Additionally, the custom fields UI (a free-text textarea) lacks structure, making it error-prone and hard to manage. The Screen element also lacks proper image placeholder behavior.

## User Stories

### US-1: Reliable Element Names
As a user, I want the element name in the plugin panel to always match the text shown on the canvas shape, so I never have to wonder which is the "real" name or manually fix mismatches.

### US-2: Structured Custom Fields
As a user, I want to define custom fields as structured name/type pairs with add and delete controls, so I can document data structures clearly and consistently.

### US-3: Screen Image Placeholder
As a user, I want the Screen element to work as a proper image placeholder, so I can easily add UI screenshots to my event model diagrams.

### US-4: Simplified Element Editing
As a user, I want a simpler editing experience without confusing toggles that cause data corruption, so I can focus on modeling instead of managing plugin state.

## Functional Requirements

### FR-1: Canvas Text as Source of Truth for Element Names

- **FR-1.1**: When a core element (command, event, query, actor) is selected, the plugin reads the canvas shape text and uses it as the authoritative element name.
- **FR-1.2**: On selection, the plugin syncs the canvas text to the plugin data `label` field and sends the updated name to the UI panel.
- **FR-1.3**: When a user edits the Name field in the plugin panel, the plugin updates both the canvas shape text and the plugin data `label` to match.
- **FR-1.4**: When a user edits the canvas shape text directly (double-click editing in FigJam), the next time the element is selected, the plugin data `label` and panel Name field update to reflect the canvas text.
- **FR-1.5**: The canvas shape text must only contain the element name — never custom field data or any other concatenated content.

### FR-2: Structured Custom Fields

- **FR-2.1**: The custom fields UI replaces the current free-text textarea with a list of field rows. Each row is laid out inline on a single line: Name input, Type input, up/down arrow buttons, and a delete button.
- **FR-2.2**: Each field row has a delete button that removes that row.
- **FR-2.3**: An "Add Field" button (plus icon) below the field list appends a new empty row.
- **FR-2.4**: The Type input is free-text (users type any string, e.g., "string", "number", "UUID", "Money").
- **FR-2.5**: Empty rows (both name and type blank) are allowed in the UI and are preserved in storage.
- **FR-2.5a**: Each field row has up/down arrow buttons to move the row's position in the list. The up button is disabled on the first row; the down button is disabled on the last row.
- **FR-2.6**: Custom fields are stored in plugin data as a YAML-formatted ordered array:
  ```
  fields:
    - userId: string
    - amount: number
    - status: string
  ```
- **FR-2.7**: Custom fields are shown for Command, Event, and Query elements only. Actor elements do not display custom fields (unchanged from current behavior).
- **FR-2.8**: Custom fields are visible and editable only in the plugin panel — they are never rendered on the canvas shape.
- **FR-2.9**: No migration of existing free-text custom field data is required.
- **FR-2.10**: Custom field changes are persisted to plugin data when the input field loses focus (on blur). Structural changes (add, delete, reorder) persist immediately.

### FR-3: Remove Show Fields (Toggle Fields Visibility)

- **FR-3.1**: The toggle/checkbox for showing fields on the canvas is removed from the UI.
- **FR-3.2**: The `toggle-fields-visibility` handler and all related sandbox code are removed.
- **FR-3.3**: The `fieldsVisible` plugin data key is no longer read or written by the plugin.
- **FR-3.4**: Elements that previously had fields visible on the canvas retain their current visual state but the plugin no longer manages or modifies it.

### FR-4: Remove Detect Drift

- **FR-4.1**: The drift detection feature (red stroke warning, sync button) is removed from the UI.
- **FR-4.2**: The `handleSelectionForDrift` and `handleSyncDrift` handlers are removed.
- **FR-4.3**: The `originalStrokeR/G/B` plugin data keys are no longer read or written.
- **FR-4.4**: Drift detection is unnecessary because the canvas text sync model (FR-1) eliminates the conditions that caused drift.

### FR-5: Screen Image Placeholder

- **FR-5.1**: The Screen element should function as an image placeholder where users can add images to replace the default gray box with window icon.
- **FR-5.2**: Users add images by dragging and dropping image files (PNG, JPG, GIF) from their file system onto a Screen element. The plugin listens for drop events and replaces the placeholder with the dropped image. (Research confirmed FigJam supports `figma.on('drop', ...)` and IMAGE fills on rectangles — see research.md.)
- **FR-5.3**: The placeholder visual (gray rectangle with window icon) remains the default appearance before an image is added.
- **FR-5.4**: Images added to a Screen element should be cropped/fitted to the Screen bounds.
- **FR-5.5**: The Screen label ("Screen" or user-edited name) should remain visible regardless of whether an image is present.

### FR-6: Export Slice to YAML

- **FR-6.1**: When a Slice is selected, an "Export to YAML" button is visible in the plugin panel (alongside the existing "Export to Markdown" button).
- **FR-6.2**: Clicking the button generates a YAML string using the same schema as the import-from-yaml feature (round-trip compatible).
- **FR-6.3**: The generated YAML includes the slice name, and arrays for commands, events, queries, and GWT sections found within the Slice.
- **FR-6.4**: Each element in the export includes its name, custom fields (in block string format matching import schema), and notes (if present).
- **FR-6.5**: Events include the `external` flag when true.
- **FR-6.6**: GWT sections include their name, description (if present), and given/when/then arrays with element name, type, and fields.
- **FR-6.7**: The YAML is copied to the system clipboard with a toast notification confirming success.
- **FR-6.8**: The Export to YAML button is only visible when a Slice is selected (same visibility rules as Export to Markdown).
- **FR-6.9**: The export reconstructs GWT structure by walking the section hierarchy: Slice → GWT sections → Given/When/Then child sections → elements within each child section.

## User Scenarios & Testing

### Scenario 1: Name Sync from Canvas Edit
1. User creates a Command element ("Command")
2. User double-clicks the shape on canvas and changes text to "PlaceOrder"
3. User clicks away, then clicks the element again to select it
4. The plugin panel Name field shows "PlaceOrder"
5. The plugin data `label` is "PlaceOrder"

### Scenario 2: Name Sync from Panel Edit
1. User selects a Command element showing "PlaceOrder"
2. User changes the Name field in the panel to "SubmitOrder"
3. The canvas shape text immediately updates to "SubmitOrder"
4. Deselecting and reselecting confirms both canvas and plugin data show "SubmitOrder"

### Scenario 3: Adding Structured Custom Fields
1. User selects an Event element
2. The plugin panel shows an empty custom fields section with an "Add Field" button
3. User clicks "Add Field" — a new row appears with empty Name and Type inputs
4. User types "orderId" in the Name input and "string" in the Type input
5. User clicks "Add Field" again and adds "total: number"
6. Both fields are saved and visible when the element is reselected
7. The canvas shape text shows only the element name — no field data

### Scenario 4: Deleting a Custom Field
1. User selects an element with 3 custom fields
2. User clicks the delete button on the second field row
3. The row is removed; remaining fields shift up and preserve their order
4. Changes persist when the element is deselected and reselected

### Scenario 5: Show Fields Toggle is Gone
1. User selects a Command element with custom fields
2. The plugin panel shows the Name field and the structured custom fields UI
3. There is no toggle/checkbox for showing fields on the canvas
4. The canvas shape text shows only the element name

### Scenario 6: No Drift Detection
1. User selects an element
2. There is no drift warning indicator, red stroke, or sync button in the UI
3. Regardless of how the name was changed (canvas or panel), no drift state is triggered

### Scenario 7: Screen Placeholder with Image
1. User creates a Screen element (gray box with window icon)
2. User adds an image to the Screen element
3. The image replaces the placeholder appearance, cropped to fit the Screen bounds
4. The Screen label remains visible

### Scenario 8: Export Slice to YAML
1. User creates a Slice with commands, events, queries, and GWT sections
2. User selects the Slice
3. User clicks "Export to YAML" in the plugin panel
4. The YAML is copied to the clipboard in the same format used by import-from-yaml
5. A toast notification shows "Copied to clipboard!"
6. User can paste the YAML into a text editor and re-import it to recreate the same Slice structure

### Scenario 9: Reorder Custom Fields
1. User selects an element with 3 custom fields: orderId, amount, status
2. User clicks the down arrow on "orderId" row
3. The order changes to: amount, orderId, status
4. User clicks the up arrow on "status" row
5. The order changes to: amount, status, orderId
6. Field order persists when the element is deselected and reselected

## Success Criteria

- Users never encounter mismatches between the canvas shape text and the element name shown in the plugin panel
- Users can add, edit, and remove custom field definitions without typing raw text format
- Field order is preserved across editing sessions
- The plugin panel UI is simpler: no Show Fields toggle, no drift warnings
- Screen elements support image content with proper placeholder behavior
- Custom field data is never rendered on the canvas shape
- Users can export a Slice to YAML in a format that can be re-imported (round-trip)
- Users can reorder custom fields using up/down arrows

## Dependencies

- Existing features modified: update-element-name, update-custom-fields, view-selected-element, create-screen, import-from-yaml (internal storage conversion), export-slice-to-markdown (read new field format)
- Features removed: toggle-fields-visibility, detect-drift
- FigJam platform capabilities for image handling (Screen placeholder — requires technical research)

## Assumptions

- No migration of existing custom field data is needed (plugin is new enough that data loss from format change is acceptable)
- Elements that previously had fields visible on the canvas from Show Fields will retain whatever visual state they're in, but the plugin will no longer modify it
- The current detect-drift plugin data keys (originalStrokeR/G/B) on existing elements will become orphaned — this is acceptable
- FigJam supports some mechanism for associating images with plugin-created elements (to be validated during implementation)

## Risks

- **FigJam image API limitations**: FigJam may not support drag-and-drop image replacement on grouped shapes. The Screen image placeholder feature may need to be descoped or implemented with a different interaction model depending on platform capabilities.
- **Canvas text detection timing**: Reading canvas text on selection change relies on FigJam firing the event after text editing is committed. If there are timing edge cases (e.g., text still in edit mode when selection fires), the sync may miss changes.

## Out of Scope

- Migration of existing free-text custom fields to the new YAML format
- Per-field validation or enforcement of type values
- Predefined type dropdown for custom fields
- Re-enabling Show Fields in any form
- Global or batch field editing across multiple elements
- Custom field display on the canvas shape
- Drag-and-drop field reordering (up/down arrows provided instead)
