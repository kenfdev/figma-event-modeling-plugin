# Feature Slices

This directory contains feature slices for the FigJam Event Modeling Plugin. Each slice is designed as a Command or Query following CQRS principles, ordered by implementation dependency.

## Overview

| Phase | ID | Type | Feature | Description | Status |
|-------|-----|------|---------|-------------|--------|
| 0 | F0.1 | Infrastructure | OpenPluginPanel | Plugin opens and displays persistent panel | Done |
| 0 | F0.2 | Query | DetectPlatform | Check if running in FigJam; show error if Figma Design | Done |
| 1 | F1.1 | Command | CreateCommand | Create blue Command element | Done |
| 1 | F1.2 | Command | CreateEvent | Create orange Event element | Done |
| 1 | F1.3 | Command | CreateQuery | Create green Query element | Done |
| 1 | F1.4 | Command | CreateActor | Create teal Actor element | Done |
| 2 | F2.1 | Query | ViewSelectedElement | Show selected element details in panel | Done |
| 2 | F2.2 | Query | ViewMultipleSelected | Show message for multiple selection | Done |
| 2 | F2.3 | Query | ViewNoSelection | Show only buttons when nothing selected | Done |
| 3 | F3.1 | Command | UpdateElementName | Edit element name in panel | Done |
| 3 | F3.2 | Command | UpdateCustomFields | Edit custom fields for Command/Event/Query | Done |
| 3 | F3.3 | Command | UpdateNotes | Edit notes for Command/Event/Query | Done |
| 3 | F3.4 | Command | ToggleEventType | Toggle Event internal/external | |
| 3 | F3.5 | Command | ToggleFieldsVisibility | Show/hide custom fields on element | Done |
| 4 | F4.1 | Command | CreateLane | Create gray swimlane | Done |
| 4 | F4.2 | Command | CreateChapter | Create cyan FigJam connector | Done |
| 4 | F4.3 | Command | CreateProcessor | Create gear icon with label | Done |
| 4 | F4.4 | Command | CreateScreen | Create image placeholder | Done |
| 5 | F5.1 | Command | CreateSlice | Create FigJam section | Done |
| 5 | F5.2 | Command | CreateGWT | Create Given/When/Then section | Done |
| 6 | F6.1 | Command | UpdateSliceIssueUrl | Edit Issue URL for Slice | Done |
| 6 | F6.2 | Query | ViewSliceIssueMarker | Show link icon when URL exists | Done |
| 6 | F6.3 | Command | OpenSliceIssueUrl | Open URL in browser | Done |
| 7 | F7.1 | Infrastructure | KeyboardShortcuts | Cmd/Ctrl+Shift+Letter shortcuts | |
| 8 | F8.1 | Command | DuplicateElement | Duplicate element with all data | Done |
| 9 | F9.1 | Query | ShowExportButton | Show Export when Slice selected | Done |
| 9 | F9.2 | Command | ExportSliceToMarkdown | Export Slice to Markdown clipboard | |
| 10 | F10.1 | Command | ImportFromYaml | Import from YAML clipboard | |

## Dependency Graph

```
Phase 0: Foundation
├── F0.1 OpenPluginPanel
└── F0.2 DetectPlatform ─────────────────────────────────────────┐
                                                                  │
Phase 1: Core Element Creation                                    │
├── F1.1 CreateCommand ◄─────────────────────────────────────────┤
├── F1.2 CreateEvent ◄───────────────────────────────────────────┤
├── F1.3 CreateQuery ◄───────────────────────────────────────────┤
└── F1.4 CreateActor ◄───────────────────────────────────────────┘
         │
         ▼
Phase 2: View Selected Element
├── F2.1 ViewSelectedElement
├── F2.2 ViewMultipleSelected
└── F2.3 ViewNoSelection
         │
         ▼
Phase 3: Edit Element Properties
├── F3.1 UpdateElementName
├── F3.2 UpdateCustomFields
├── F3.3 UpdateNotes
├── F3.4 ToggleEventType (Event only)
└── F3.5 ToggleFieldsVisibility
         │
         ▼
Phase 4: Structural Elements (can be parallel with Phase 2-3)
├── F4.1 CreateLane
├── F4.2 CreateChapter
├── F4.3 CreateProcessor
└── F4.4 CreateScreen
         │
         ▼
Phase 5: Section Elements
├── F5.1 CreateSlice
└── F5.2 CreateGWT
         │
         ▼
Phase 6: Slice Features
├── F6.1 UpdateSliceIssueUrl
├── F6.2 ViewSliceIssueMarker
└── F6.3 OpenSliceIssueUrl
         │
         ▼
Phase 7: Keyboard Shortcuts (requires all element creation)
└── F7.1 KeyboardShortcuts
         │
         ▼
Phase 8: Duplicate
└── F8.1 DuplicateElement
         │
         ▼
Phase 9: Export
├── F9.1 ShowExportButton
└── F9.2 ExportSliceToMarkdown
         │
         ▼
Phase 10: Import
└── F10.1 ImportFromYaml
```

## Implementation Order

1. **Phase 0**: Foundation - Must be done first
2. **Phase 1**: Core elements - Basic functionality
3. **Phase 2**: Selection viewing - User can see what's selected
4. **Phase 3**: Element editing - User can modify elements
5. **Phase 4**: Structural elements - Can overlap with Phase 2-3
6. **Phase 5**: Sections - Requires understanding of FigJam sections
7. **Phase 6**: Slice features - Builds on Slice
8. **Phase 7**: Shortcuts - Quality of life improvement
9. **Phase 8**: Duplicate - Convenience feature
10. **Phase 9**: Export - Documentation feature
11. **Phase 10**: Import - Bulk creation feature
