# Plugin UX Enhancements

## Overview

A collection of four targeted improvements to the FigJam Event Modeling plugin: resizing the plugin panel to better use available space, simplifying the Screen element to a single shape, adding a Connect feature for creating arrows between elements, and extending Copy to YAML to all core shapes and sections.

## Clarifications

### Session 2026-03-28

- Q: Should Connect work for all element types or just core shapes? → A: All element types (any two selected nodes).
- Q: What YAML format for single-element export? → A: Minimal flat format (name, type, fields). Applies to core shapes and sections only.
- Q: Max panel height? → A: 1100px.
- Q: Screen visual after simplification? → A: Plain gray rectangle with text label, no icon, no group.
- Q: Connector type for Connect feature? → A: FigJam native connector (stays attached on move), curve style, black color.
- Q: How is Connect triggered? → A: Panel button in the multi-selection area (where "Multiple elements selected" currently shows).
- Q: How is Copy to YAML triggered? → A: Panel button per element, shown when a core shape or section is selected.
- Q: Arrow direction fallback? → A: Trust FigJam selection order (first = source, second = target).
- Q: Does Connect require both nodes to be plugin elements? → A: No — any connectable shape on the canvas, not limited to plugin elements.
- Q: What YAML structure for GWT export? → A: Flat top-level with name, type: gwt, and given/when/then arrays. Each element has name, type, and optional fields.
- Q: Minimum panel height? → A: 400px (current default as floor).
- Q: Allow duplicate connectors between same pair? → A: Yes — each Connect click creates a new connector (matches FigJam native behavior).

## Problem Statement

Users face several friction points in the current plugin experience: the panel is too short and wastes screen space on large monitors; the Screen element is a grouped shape (rectangle + SVG icon + text) which makes it cumbersome to replace with screenshots; there is no quick way to connect two elements without switching to FigJam's native connector tool; and only Slices can be copied to YAML, while users need to export individual elements too.

## User Stories

### US-1: Taller Plugin Panel
As a user, I want the plugin panel to use more of my screen height so I can see more content without scrolling, especially when editing elements with many custom fields.

### US-2: Simple Screen Element
As a user, I want the Screen element to be a single rectangle so I can easily paste or drag images onto it without dealing with grouped sub-shapes.

### US-3: Quick Element Connection
As a user, I want to quickly create a curved arrow between two selected elements so I can build event flows without switching to the FigJam connector tool.

### US-4: Copy Any Element to YAML
As a user, I want to copy any core shape or section element to YAML so I can use element data in external tools, documentation, or re-import workflows.

## Functional Requirements

### FR-1: Panel Default Height (80% Viewport)

- **FR-1.1**: The plugin panel opens at 80% of the current viewport height instead of the current fixed 400px.
- **FR-1.2**: The panel height is capped at a maximum of 1100px and a minimum of 400px (the current default), regardless of viewport size.
- **FR-1.3**: The panel width remains unchanged at 300px.
- **FR-1.4**: The panel retains its existing resize handle behavior — users can still manually resize after opening.

### FR-2: Screen Element Simplification

- **FR-2.1**: The Screen element is created as a single rectangle (not a group). No SVG icon node or separate text node is created.
- **FR-2.2**: The rectangle is 200x160px, gray fill (#E5E5E5 / rgb 0.9, 0.9, 0.9), with 4px corner radius.
- **FR-2.3**: The rectangle displays the label "Screen" as its text content (using the same font as other core shapes).
- **FR-2.4**: Plugin data (`type: 'screen'`, `label: 'Screen'`) is set directly on the rectangle node, not on a group.
- **FR-2.5**: Existing Screen elements (created as groups) are not migrated — only new Screen elements use the simplified format.
- **FR-2.6**: The Screen element can be selected and viewed in the plugin panel like other elements (type shown as "Screen").

### FR-3: Connect Two Elements

- **FR-3.1**: When exactly 2 elements are selected, a "Connect" button appears in the plugin panel in the multi-selection area.
- **FR-3.2**: Clicking the Connect button creates a FigJam native connector between the two selected elements.
- **FR-3.3**: The connector goes from the first element in the selection array (source) to the second element (target).
- **FR-3.4**: The connector uses the "curve" stroke style (not straight or elbow).
- **FR-3.5**: The connector color is black.
- **FR-3.6**: The Connect button works for any two connectable shapes on the canvas — plugin elements, native FigJam shapes, stickies, etc. It is not limited to plugin-created elements.
- **FR-3.7**: The Connect button is only visible when exactly 2 nodes are selected. For 1 or 3+ selections, the current behavior is preserved.
- **FR-3.8**: After creating the connector, the selection is not changed — both elements remain selected.
- **FR-3.9**: Multiple connectors between the same pair of elements are allowed. Each Connect click creates a new connector.

### FR-4: Copy Element to YAML

- **FR-4.1**: A "Copy to YAML" button appears in the plugin panel when a single core shape (command, event, query, actor) or section (slice, GWT) is selected.
- **FR-4.2**: For core shapes, clicking the button copies YAML in this minimal flat format:
  ```
  name: PlaceOrder
  type: command
  fields:
    - userId: string
    - amount: number
  ```
- **FR-4.3**: The `name` field is the element's label. The `type` field is the element type (command, event, query, actor).
- **FR-4.4**: For events, an `external: true` field is included when the event is external type.
- **FR-4.5**: The `fields` key is only present when the element has custom fields. Elements without custom fields omit the `fields` key entirely.
- **FR-4.6**: The `notes` key is included when the element has notes content.
- **FR-4.7**: For Slice elements, the existing Export to YAML functionality (FR-6 from the data model spec) is reused — the button label matches the existing "Export to YAML" button.
- **FR-4.8**: For GWT sections, the YAML follows this structure:
  ```
  name: Login Scenario
  type: gwt
  given:
    - name: UserExists
      type: event
      fields:
        - userId: string
  when:
    - name: LoginAttempt
      type: command
  then:
    - name: UserLoggedIn
      type: event
  ```
  Each element within given/when/then includes name, type, and optional fields (same minimal flat format as core shapes).
- **FR-4.9**: The YAML is copied to the system clipboard with a toast notification confirming "Copied to clipboard!"
- **FR-4.10**: The Copy to YAML button is not shown for structural elements (lane, chapter, processor) or Screen elements.

## User Scenarios & Testing

### Scenario 1: Panel Opens at 80% Height
1. User opens the plugin on a 1080p monitor (viewport height ~900px)
2. The panel opens at 720px height (80% of 900)
3. The panel width is 300px
4. User can see more creation buttons and element detail without scrolling

### Scenario 2: Panel Height Capped at 1100px
1. User opens the plugin on a 4K monitor (viewport height ~2000px)
2. The panel opens at 1100px height (capped, not 1600px)
3. The panel is tall but not excessively so

### Scenario 3: Create a Simple Screen Element
1. User clicks the Screen button in the plugin panel
2. A single gray rectangle appears on the canvas with "Screen" text
3. The rectangle is not a group — it's a single node
4. Selecting it shows "Screen" type in the plugin panel
5. User can paste an image directly onto the rectangle without ungrouping

### Scenario 4: Connect Two Elements
1. User creates a Command and an Event
2. User shift-clicks to select both elements
3. The plugin panel shows "Multiple elements selected" and a "Connect" button
4. User clicks Connect
5. A curved black arrow appears from the Command (first selected) to the Event (second selected)
6. Moving either element causes the connector to follow

### Scenario 5: Connect Non-Core Elements
1. User selects a Lane and a Processor
2. The Connect button appears
3. User clicks Connect — a curved black arrow connects them

### Scenario 6: Copy Command to YAML
1. User selects a Command element named "PlaceOrder" with fields userId:string and amount:number
2. User clicks "Copy to YAML" in the plugin panel
3. Clipboard contains:
   ```
   name: PlaceOrder
   type: command
   fields:
     - userId: string
     - amount: number
   ```
4. Toast notification shows "Copied to clipboard!"

### Scenario 7: Copy Event with External Flag
1. User selects an external Event named "PaymentReceived"
2. User clicks "Copy to YAML"
3. Clipboard contains:
   ```
   name: PaymentReceived
   type: event
   external: true
   ```

### Scenario 8: Copy Actor (No Fields)
1. User selects an Actor named "Admin"
2. User clicks "Copy to YAML"
3. Clipboard contains:
   ```
   name: Admin
   type: actor
   ```
4. No `fields` key is present

### Scenario 9: Three or More Elements Selected
1. User selects 3 elements
2. The panel shows "Multiple elements selected" but no Connect button
3. No Copy to YAML button is shown

### Scenario 10: Copy GWT Section to YAML
1. User selects a GWT section named "Login Scenario" with Given/When/Then children populated
2. User clicks "Copy to YAML"
3. Clipboard contains YAML with name, type: gwt, and given/when/then arrays with each element's name, type, and optional fields
4. Toast notification shows "Copied to clipboard!"

## Success Criteria

- The plugin panel opens at 80% of viewport height, capped at 1100px, on every launch
- Users can create Screen elements that are single shapes, not groups
- Users can connect any two selected elements with one click, producing a curved black connector
- Users can copy any core shape or section to YAML via a panel button
- The Connect button appears only when exactly 2 elements are selected
- Connectors created by Connect stay attached when elements are moved
- Copied YAML for core shapes follows the minimal flat format (name, type, fields)
- Toast notification confirms clipboard copy success

## Dependencies

- Existing features modified: open-plugin-panel (panel height), create-screen (simplification), view-selected-element (multi-select Connect button, Copy to YAML button)
- FigJam platform: native connector creation capability
- Existing Copy to YAML for Slices (export-slice-to-yaml) is extended or complemented

## Assumptions

- FigJam's plugin API supports creating native connectors with specified endpoint nodes, stroke style (curve), and color
- FigJam's selection order is deterministic and reflects the order in which elements were selected
- The Screen element as a single shape can still receive pasted images via FigJam's native paste behavior
- Existing grouped Screen elements will continue to work but won't benefit from the simplification
- The panel height calculation uses the viewport height available at plugin open time

## Risks

- **Selection order reliability**: FigJam's selection array may not reliably reflect the order elements were selected. If order is not preserved, the arrow direction could be unexpected. Mitigation: test actual FigJam behavior; if unreliable, document as a known limitation.
- **Connector API limitations**: FigJam's connector creation API may have constraints on curve style or color that differ from expectations. Mitigation: validate during implementation research.
- **Screen text on single shape**: Displaying a text label directly on a single shape (without a separate grouped text node) may require using a different shape type than a basic rectangle. Mitigation: validate during implementation which shape type supports embedded text.

## Out of Scope

- Migrating existing grouped Screen elements to the new single-shape format
- Connector labels or annotations
- Batch connecting more than 2 elements at once
- Copy to YAML for structural elements (lane, chapter, processor) or Screen
- Keyboard shortcut for Connect
- Custom connector styling options (color picker, stroke weight)
