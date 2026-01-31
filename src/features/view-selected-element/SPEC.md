# View Selected Element

## F2.1: ViewSelectedElement

### Type
Query

### Description
When user selects a plugin element, show its details (name, type) in panel.

### User Story
As a user, I want to see the details of a selected element in the plugin panel so I can view and edit its properties.

### Acceptance Criteria
- When a single plugin element is selected, panel shows element editor section
- Editor displays:
  - Element type indicator
  - Element name (editable field)
- Editor section appears below the creation buttons
- Selection changes update the panel in real-time

### Dependencies
- F0.1: OpenPluginPanel
- F1.1-F1.4: At least one element type must exist

### Technical Notes
- Panel listens to selection change events
- Element name is editable via panel only (not directly on canvas per spec)
- Different element types show different fields (see edit features for details)

---

## F2.2: ViewMultipleSelected

### Type
Query

### Description
When multiple elements selected, show "Multiple elements selected" message.

### User Story
As a user, I want to know when I have multiple elements selected and understand that I cannot edit them simultaneously.

### Acceptance Criteria
- When multiple plugin elements are selected, panel shows "Multiple elements selected" message
- No editable fields are shown for multiple selection
- Creation buttons remain visible and functional
- Message is clear and non-intrusive

### Dependencies
- F0.1: OpenPluginPanel
- F2.1: ViewSelectedElement

### Technical Notes
- This is a UI state, not a blocking error
- User can still create new elements while multiple are selected

---

## F2.3: ViewNoSelection

### Type
Query

### Description
When no plugin element selected, show only creation buttons.

### User Story
As a user, I want to see only the creation buttons when nothing is selected, keeping the interface clean.

### Acceptance Criteria
- When no element is selected, panel shows only creation buttons
- When a non-plugin element is selected (native FigJam shape), panel shows only creation buttons
- Element editor section is hidden
- Panel layout adjusts smoothly

### Dependencies
- F0.1: OpenPluginPanel
- F2.1: ViewSelectedElement

### Technical Notes
- "No plugin element" includes: nothing selected, or native FigJam elements selected
- Check plugin data to determine if selection is a plugin element

---

## F2.4: ViewStructuralElementType

### Type
Query

### Description
When a structural element (Lane, Chapter, Processor, Screen) or section element (Slice, GWT) is selected, show a colored type badge and read-only element details in the panel.

### User Story
As a user, I want to see what type of structural or section element I have selected so I can quickly identify it in the panel.

### Acceptance Criteria
- When a structural element (Lane, Chapter, Processor, Screen) is selected, the panel shows:
  - A colored type badge matching the element's type
  - Element name (read-only)
  - Notes field (editable)
- When a section element (Slice, GWT) is selected, the panel shows:
  - A colored type badge with appropriate styling
- Type badge colors for structural elements:
  - Lane: Light gray
  - Chapter: Cyan
  - Processor: Black
  - Screen: Gray
- Type badge colors for section elements:
  - Slice: Distinct color (to be determined during implementation)
  - GWT: Distinct color (to be determined during implementation)
- Name field is read-only for structural elements (users rename on canvas)
- Notes field is editable for structural elements

### Dependencies
- F2.1: ViewSelectedElement
- F4.1-F4.4: Structural element creation features

### Technical Notes
- Add type labels to the `typeLabels` map for: lane, chapter, processor, screen
- Add CSS styling for `.type-lane`, `.type-chapter`, `.type-processor`, `.type-screen`, `.type-slice`, `.type-gwt`
- The selection handler already reads `getPluginData('type')` — structural elements need to have their type stored in plugin data at creation time
- Name field uses a disabled/read-only input rather than hiding it entirely
