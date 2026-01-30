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

## Feature Index

Each feature has a detailed SPEC.md file colocated with its source code.

| ID | Feature | Status | Spec |
|----|---------|--------|------|
| F0.1 | OpenPluginPanel | Done | `src/features/open-plugin-panel/SPEC.md` |
| F0.2 | DetectPlatform | Done | `src/features/open-plugin-panel/SPEC.md` |
| F1.1 | CreateCommand | Done | `src/features/create-command/SPEC.md` |
| F1.2 | CreateEvent | Done | `src/features/create-event/SPEC.md` |
| F1.3 | CreateQuery | Done | `src/features/create-query/SPEC.md` |
| F1.4 | CreateActor | Done | `src/features/create-actor/SPEC.md` |
| F2.1 | ViewSelectedElement | Done | `src/features/view-selected-element/SPEC.md` |
| F2.2 | ViewMultipleSelected | Done | `src/features/view-selected-element/SPEC.md` |
| F2.3 | ViewNoSelection | Done | `src/features/view-selected-element/SPEC.md` |
| F3.1 | UpdateElementName | Done | `src/features/update-element-name/SPEC.md` |
| F3.2 | UpdateCustomFields | Done | `src/features/update-custom-fields/SPEC.md` |
| F3.3 | UpdateNotes | Done | `src/features/update-notes/SPEC.md` |
| F3.4 | ToggleEventType | | `src/features/toggle-event-type/SPEC.md` |
| F3.5 | ToggleFieldsVisibility | Done | `src/features/toggle-fields-visibility/SPEC.md` |
| F4.1 | CreateLane | Done | `src/features/create-lane/SPEC.md` |
| F4.2 | CreateChapter | Done | `src/features/create-chapter/SPEC.md` |
| F4.3 | CreateProcessor | Done | `src/features/create-processor/SPEC.md` |
| F4.4 | CreateScreen | Done | `src/features/create-screen/SPEC.md` |
| F5.1 | CreateSlice | Done | `src/features/create-slice/SPEC.md` |
| F5.2 | CreateGWT | Done | `src/features/create-gwt/SPEC.md` |
| F6.1 | UpdateSliceIssueUrl | Done | `src/features/update-slice-issue-url/SPEC.md` |
| F6.2 | ViewSliceIssueMarker | Done | `src/features/view-slice-issue-marker/SPEC.md` |
| F6.3 | OpenSliceIssueUrl | Done | `src/features/open-slice-issue-url/SPEC.md` |
| F8.1 | DuplicateElement | Done | `src/features/duplicate-element/SPEC.md` |
| F9.1 | ShowExportButton | Done | `src/features/export-slice-to-markdown/SPEC.md` |
| F9.2 | ExportSliceToMarkdown | Done | `src/features/export-slice-to-markdown/SPEC.md` |
| F10.1 | ImportFromYaml | Done | `src/features/import-from-yaml/SPEC.md` |
| F2.4 | ViewStructuralElementType | Done | `src/features/view-selected-element/SPEC.md` |
| F11.1 | ChangeElementType | | `src/features/change-element-type/SPEC.md` |
| F12.1 | Internationalization | | `src/shared/i18n/SPEC.md` |

## Feature Backlog

Ideas under consideration. When ready to implement, flesh out via discussion, then create `src/features/<name>/SPEC.md` and add a row to the Feature Index table above.

- improve the plugin panel. it isn't intuitive. the "Core shapes" look nice. but all the other stuff aren't intuitive at all. the ux should be improved
- all the core shapes should be locked by default. this will prevend users who do not have the plugin installed easily edit the contents of the shape. when the plugin is active and the shape is selected, the lock is unlocked. Whenever the user attempts to edit the content directly, an error indicator should notify the user not to directly edit the shape content and edit via plugin.
- there should be an `raw` toggle, which shows the raw json properties of the shape. it's editable, but validates the json. if invalid, it gives feedback to the user and will not accept the change.


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
