# Research: UX Polish Batch

**Created**: 2026-04-03

## R1: FigJam SQUARE Shape Type Behavior

**Decision**: Use `shapeType = 'SQUARE'` for all core element shapes (command, event, query, actor).

**Rationale**: The previous UX enhancements spec (20260328132955) already validated and shipped SQUARE shape type for the Screen element (`create-screen/handlers.ts`). The SQUARE type in FigJam's `createShapeWithText()` API accepts custom dimensions via `resize()` — it is not locked to 1:1 aspect ratio. Elements retain sharp corners on user resize, unlike ROUNDED_RECTANGLE which reverts to rounded corners.

**Alternatives considered**:
- Keep ROUNDED_RECTANGLE with cornerRadius=0: Rejected — corners round on resize.
- Use native rectangles instead of ShapeWithText: Rejected — would lose built-in text support.

## R2: FigJam Section Title Bar Height

**Decision**: Use `marker.y = 40` for issue link markers (up from 8).

**Rationale**: FigJam section title bars are approximately 30-40px tall. A Y offset of 40px places the marker just below the title bar in most cases. This was confirmed through user testing of the current plugin where markers at y=8 are hidden.

**Alternatives considered**:
- y=50: More generous but wastes vertical space unnecessarily.
- Bottom-left placement: User preferred top-left positioning.

## R3: RESERVED_TOP_SPACE for Imported Slices

**Decision**: Increase from 240px to 400px.

**Rationale**: The current 240px is insufficient for placing a Screen element (200x160px) above the command row with comfortable padding. 400px provides 160px (screen height) + 240px remaining gap, which gives adequate breathing room.

**Alternatives considered**:
- 360px: Too tight when accounting for processor elements.
- 480px: Unnecessarily large, creates too much empty space.

## R4: Import UI Relocation Pattern

**Decision**: Move import from SettingsPanel to main Panel using existing collapsible section pattern.

**Rationale**: The Panel already uses a `ButtonGroup` component with collapsible headers (▸/▾ toggle). The "Other" section will follow this same pattern. The import textarea and button will be rendered inside the collapsed section body. This is the existing collapsible section pattern — no new component needed.

**Alternatives considered**:
- New dedicated component: Rejected — unnecessary complexity for a single section.
- Tab-based UI: Rejected — overcomplicated for a single feature.

## R5: Error Display for YAML Import

**Decision**: Add `import-from-yaml-error` message listener in Panel.tsx; display error inline below textarea; clear on edit or successful import.

**Rationale**: The sandbox handler already sends `import-from-yaml-error` messages with descriptive error text. The UI simply needs to listen for this message type and display the error. No changes needed to the sandbox handler or parser. Error messages are English-only (not localized via i18n).

**Alternatives considered**:
- Toast notification: User preferred inline display over transient toast.
- Both inline + toast: Unnecessarily redundant.
