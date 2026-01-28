# Figma Event Modeling Plugin Specification

## Overview

A FigJam plugin for creating Event Modeling diagrams. The plugin provides a persistent panel with buttons for creating various element types, allowing users to visually model event-driven systems.

## Platform

- **Target**: FigJam (not Figma Design)
- **Behavior**: If run in Figma Design, open the plugin panel and show an error message explaining the plugin requires FigJam

## Element Types

All element types are MVP requirements. Elements are created as grouped shapes (not Figma components) and placed at viewport center.

### Core Shapes (176×80px, 16px font)

| Element | Color | Shape | Description |
|---------|-------|-------|-------------|
| Command | Blue (#4A90D9) | Rectangle | User intent/action that triggers state changes |
| Event (internal) | Orange (#FF9E42) | Rectangle | Immutable fact that something happened within the system |
| Event (external) | Purple (#9B59B6) | Rectangle | Immutable fact from external systems |
| Query | Green (#7ED321) | Rectangle | Request for data/view |
| Actor | Teal (#50E3C2) | Rectangle (176×80px) | User persona (Admin, Customer, etc.) |

### Structural Elements

| Element | Color/Style | Shape | Description |
|---------|-------------|-------|-------------|
| Lane | Gray fill (5% opacity, light gray) | Rectangle | Horizontal swimlane; default width is half the viewport width; created with no label |
| Chapter | Cyan | FigJam native connector (unconnected), 200px width | Groups multiple slices (epics); label rendered on the arrow |
| Processor | Black gear icon (custom SVG) + label | Gear above, label below | Automation/background process |
| Screen | Gray | Image container | Placeholder for UI screenshots (gray box with window icon before image pasted); images are cropped to fit the Screen bounds |

### Section Elements (FigJam Sections)

| Element | Description |
|---------|-------------|
| Slice | FigJam section representing a vertical slice; can contain Issue URL |
| GWT | FigJam section (400×600px) with 3 auto-created nested sections (350×180px each) arranged vertically: Given, When, Then |

## Element Data Model

Each plugin-created element stores a `type` field in plugin data to identify its element type.

### Default Naming

Newly created elements use their type as the default name (e.g., "Command", "Event", "Query").

### Custom Fields

Command, Event, and Query elements support custom fields:

- **Input format**: Free-form text (e.g., `userId: string`, `amount: number`) - no validation or structure enforcement
- **Storage**: Plugin data only (not visible outside plugin UI)
- **Notes**: Free-form text area for additional context (unlimited character length)

### Event Internal/External Toggle

Event elements have a toggle to mark them as internal or external:
- Internal: Orange (#FF9E42)
- External: Purple (#9B59B6)

### Custom Fields Visibility Toggle

- **Scope**: Selected elements only (not global)
- **Location**: Toggle/checkbox in the element's edit section within the panel
- **Behavior**: Show/hide the custom fields section on selected elements
- **Data retention**: Fields data is retained when hidden (only visibility changes)
- **Sizing**: Elements shrink when fields hidden, expand when shown

## User Interface

### Plugin Panel

- **Type**: Persistent panel (stays open while in use)
- **Layout**: Single scrollable view with:
  - Element creation buttons at top (grouped visually: Core Shapes | Structural | Sections)
  - Selected element editor below
  - Export button (shown only when a Slice is selected)
  - Minimal help link at bottom
- **Selection behavior**:
  - **Single element selected**: Panel shows full editor with all editable fields for that element type
  - **Multiple elements selected**: Panel shows "Multiple elements selected" message with no editable fields
  - **No plugin element selected**: Panel shows only creation buttons

### Element Editor Fields

Shown when a single plugin element is selected:

- **All elements**: Element name (editable via panel only, not on canvas)
- **Command/Event/Query**: Custom fields textarea, Notes textarea, Show/Hide fields toggle
- **Event only**: Internal/External toggle
- **Slice only**: Issue URL field
- **Elements with custom fields**: Duplicate button

### Element Placement

- Elements placed at **viewport center** on creation
- No overlap detection or offset; elements may overlap
- User moves elements manually after placement

## Keyboard Shortcuts

Keyboard shortcuts work only when the FigJam canvas is focused (disabled when typing in text inputs).

Modifier pattern: **Cmd/Ctrl + Shift + Letter**

| Element | Shortcut |
|---------|----------|
| Command | Cmd+Shift+C |
| Event | Cmd+Shift+E |
| Query | Cmd+Shift+Q |
| Actor | Cmd+Shift+A |
| Lane | Cmd+Shift+L |
| Chapter | Cmd+Shift+H |
| Processor | Cmd+Shift+P |
| Screen | Cmd+Shift+S |
| Slice | Cmd+Shift+I |
| GWT | Cmd+Shift+G |

## Slice Features

### Issue URL

- Slices can contain an Issue URL linking to external issue trackers
- **Format**: Any text accepted (no URL validation)
- **Editing**: URL field shown in plugin panel when Slice is selected
- **Marker**: Small link icon in corner of Slice section (hidden if URL is empty)
- **Interaction**: Clicking the marker opens URL directly in default browser

## GWT (Given-When-Then) Features

### Auto-creation

When user creates a GWT element:
1. Parent GWT section is created (400×600px)
2. Three nested sections are automatically created inside, arranged vertically (each 350×180px):
   - "Given" section
   - "When" section
   - "Then" section

### Content

Users place Event Modeling elements and/or text content inside each sub-section.

### Recovery

If a user deletes the Given/When/Then sub-sections but keeps the parent GWT section, the plugin does not auto-regenerate them (respects user's deletion).

## Copy/Paste Behavior

When plugin elements are copied and pasted:
- **All plugin data is preserved**: type, custom fields, notes, and other metadata are cloned to the pasted element

## Duplicate Feature

- **Location**: Duplicate button in the element editor section of the panel
- **Behavior**: Creates a copy of the selected element with all plugin data, offset from the original

## Export

### Trigger

- Export button appears in the panel only when a Slice is selected
- Export operates on elements within the selected FigJam Section (Slice)

### Output Format

- **Format**: Markdown text
- **Delivery**: Copy to clipboard
- **Feedback**: Toast notification "Copied to clipboard!"
- **Validation**: None (exports whatever is present, including empty slices)

### Header

Export includes only the slice name as the top-level heading:
```markdown
# SliceName
```

### Handling Unknown Elements

When exporting a Slice containing non-plugin elements (user-drawn shapes, images, etc.):
- Attempt to describe unknown elements (e.g., "Rectangle", "Image", "Connector")
- Include these descriptions in the relevant section

### Structure

Grouped by element type:

```markdown
# Order Processing Slice

## Commands
- CreateOrder
  - userId: string
  - items: array
  - Notes: Initiated by customer from checkout

## Events
- OrderCreated
  - orderId: string
  - timestamp: date

## Queries
- GetOrderStatus
  - orderId: string

## GWT: [GWT Section Name]
### Given
- [Events in Given section]
- [Text content in Given section]

### When
- [Commands in When section]
- [Text content in When section]

### Then
- [Queries in Then section]
- [Text content in Then section]
```

### Detail Level

Full details exported:
- Element names
- Custom fields (if present)
- Notes (if present)
- GWT sub-section content (element names + text)

## Import (MVP)

### Trigger

- "Import from Clipboard" button in the panel
- Reads YAML from system clipboard

### YAML Schema

```yaml
slice: Order Processing Slice

commands:
  - name: CreateOrder
    fields: |
      userId: string
      items: array
    notes: Customer checkout flow

events:
  - name: OrderCreated
    external: false
    fields: |
      orderId: string
      timestamp: date

queries:
  - name: GetOrderStatus
    fields: |
      orderId: string

gwt:
  - name: Order Creation Scenario
    given:
      - OrderSubmitted event
      - User logged in
    when:
      - CreateOrder command
    then:
      - OrderCreated event
```

### Field Descriptions

- **slice** (required): Name of the Slice section to create
- **commands**: Array of Command elements
  - `name` (required): Element name
  - `fields` (optional): Free-form text for custom fields
  - `notes` (optional): Notes text
- **events**: Array of Event elements
  - `name` (required): Element name
  - `external` (optional): Boolean, defaults to false (internal)
  - `fields` (optional): Free-form text for custom fields
  - `notes` (optional): Notes text
- **queries**: Array of Query elements
  - `name` (required): Element name
  - `fields` (optional): Free-form text for custom fields
  - `notes` (optional): Notes text
- **gwt**: Array of GWT sections
  - `name` (required): GWT section name
  - `given` (optional): Array of text strings for Given section
  - `when` (optional): Array of text strings for When section
  - `then` (optional): Array of text strings for Then section

### Import Behavior

- **Validation**: Validate YAML structure and report specific errors for invalid content
- **Layout**: Elements arranged in vertical lanes by type (Commands | Events | Queries columns)
- **GWT handling**: Given/when/then items are created as text labels (not linked to other elements)
- **Post-import**: The newly created Slice is automatically selected
- **Placement**: Elements placed at viewport center

## Technical Behavior

### Figma/FigJam Integration

- **Shape type**: Custom shapes (not native FigJam stickies)
- **Structure**: Grouped shapes (not Figma components)
- **Undo**: Native Figma undo (no custom undo handling)
- **Persistence**: No preferences saved between sessions
- **Connectors**: Users use native FigJam connector tool; plugin does not manage arrows

### Collaboration

- **Conflict resolution**: Last write wins (no locking mechanism)
- **Known limitation**: If multiple users edit the same element's plugin data simultaneously, the last save overwrites previous changes

### User Modifications

- Plugin **always preserves** user modifications to elements
- If user resizes, recolors, or edits text, those changes are kept

### Swimlane Management

- Plugin creates Lane elements but does **not** manage swimlane layout
- Users position and organize swimlanes manually

## Color Reference

| Element | Hex Code |
|---------|----------|
| Command | #4A90D9 |
| Event (internal) | #FF9E42 |
| Event (external) | #9B59B6 |
| Query | #7ED321 |
| Actor | #50E3C2 |
| Lane | Light gray, 5% opacity fill |
| Chapter | Cyan (FigJam connector default) |
| Processor | Black (gear icon) |
| Screen placeholder | Gray |

## Sizing Reference

| Element | Dimensions |
|---------|------------|
| Core shapes (Command, Event, Query, Actor) | 176×80px |
| Lane | Half viewport width × 120px height |
| Chapter | 200px width (FigJam connector) |
| GWT parent section | 400×600px |
| GWT child sections (Given/When/Then) | 350×180px each |
| Processor | Based on icon + label |

## Future Considerations (Post-MVP)

- **Search/filter**: Find elements by name, type, or field content with "jump to" functionality
- May be necessary given target scale of 200+ elements per diagram

## Out of Scope

- Automatic connections/arrows between elements
- Validation of element relationships
- Swimlane auto-management
- Global toggle for fields (selection-only)
- Per-element expand/collapse (selection toggle only)
- Component-based elements
- Session persistence
- Figma Design support
- Collaborative locking
- Canvas-based name editing (panel only)
- Custom field structure validation
- URL format validation for Slice Issue URLs
