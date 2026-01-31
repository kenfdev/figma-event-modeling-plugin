# Open Plugin Panel

## F0.1: OpenPluginPanel

### Type
Infrastructure

### Description
Plugin opens and displays persistent panel with creation buttons.

### User Story
As a user, I want to open the plugin and see a panel with buttons to create Event Modeling elements.

### Acceptance Criteria
- Plugin can be launched from FigJam plugins menu
- Panel opens as a persistent panel (stays open while in use)
- Panel displays element creation buttons grouped visually:
  - Core Shapes: Command, Event, Query, Actor
  - Structural: Lane, Chapter, Processor, Screen
  - Sections: Slice, GWT
- Panel is scrollable
- Minimal help link shown at bottom of panel

### Technical Notes
- Panel type: Persistent panel
- Layout: Single scrollable view

---

## F0.2: DetectPlatform

### Type
Query

### Description
Check if running in FigJam; show error message if in Figma Design.

### User Story
As a user, I want to be informed if I accidentally try to use the plugin in Figma Design instead of FigJam.

### Acceptance Criteria
- Plugin detects whether it's running in FigJam or Figma Design
- If running in Figma Design:
  - Plugin panel opens
  - Error message is displayed explaining the plugin requires FigJam
  - Creation buttons are disabled or hidden
- If running in FigJam:
  - Plugin operates normally

### Dependencies
- F0.1: OpenPluginPanel

### Technical Notes
- Use Figma Plugin API to detect editor type

---

## F0.3: PanelUXRedesign

### Type
Enhancement

### Description
Improve the plugin panel by replacing plain text buttons with card-style element previews and adding collapsible sections. Each creation button shows a mini colored preview of the element it creates, making the panel more visually intuitive.

### User Story
As a user, I want the plugin panel to visually show me what each element looks like before I create it, so I can quickly find and create the right element type without guessing.

### Acceptance Criteria
- Each creation button is rendered as a small card showing a mini colored preview of the element it creates
  - Command: blue rectangle preview
  - Event: orange rectangle preview
  - Query: green rectangle preview
  - Actor: teal rectangle preview
  - Lane: light gray rectangle preview
  - Chapter: cyan arrow/connector preview
  - Processor: black gear icon preview
  - Screen: gray window icon preview
  - Slice: section-style preview
  - GWT: nested sections preview
- Section headings ("Core Shapes", "Structural", "Sections") are kept as-is
- All three sections are collapsible/expandable by clicking the section heading
- All sections are expanded by default when the panel opens
- Collapse state is not persisted between sessions (resets to expanded on open)
- Section headings show a collapse/expand chevron indicator
- Clicking a card creates the element (same behavior as current buttons)
- Panel remains scrollable
- Existing functionality (element editor, settings, toast, resize) is unaffected

### Dependencies
- F0.1: OpenPluginPanel
- F12.1: Internationalization

### Technical Notes
- Modify `ButtonGroup` component in `Panel.tsx` to render card-style buttons instead of plain buttons
- Each card contains: a small colored shape preview (CSS-rendered, not images) + the element label
- Cards should use a grid layout (2 columns) within each section
- Collapsible sections: simple boolean state per section, toggled by clicking the header
- Section headers get a chevron icon (▸ collapsed, ▾ expanded) via CSS/unicode
- No new message types or sandbox changes needed — this is purely UI
- Card preview colors should match the element color constants from the codebase
