# Data Model: UX Polish Batch

**Created**: 2026-04-03

## Changes Summary

No new entities, fields, or data model changes. All changes are cosmetic (shape type, positioning) or UI-only (error display, panel layout).

## Constants Modified

| Constant | File | Old Value | New Value |
|----------|------|-----------|-----------|
| `shapeType` | create-command/handlers.ts | `'ROUNDED_RECTANGLE'` | `'SQUARE'` |
| `shapeType` | create-event/handlers.ts | `'ROUNDED_RECTANGLE'` | `'SQUARE'` |
| `shapeType` | create-query/handlers.ts | `'ROUNDED_RECTANGLE'` | `'SQUARE'` |
| `shapeType` | create-actor/handlers.ts | `'ROUNDED_RECTANGLE'` | `'SQUARE'` |
| `shapeType` | import-from-yaml/handlers.ts (×4 locations) | `'ROUNDED_RECTANGLE'` | `'SQUARE'` |
| `CORNER_RADIUS` constants | all above files | `0` | removed |
| `RESERVED_TOP_SPACE` | import-from-yaml/handlers.ts | `240` | `400` |
| `marker.y` | update-slice-issue-url/handlers.ts | `8` | `40` |

## Message Protocol

No new message types. Existing `import-from-yaml-error` message (already sent by sandbox) is now handled in the UI:

```typescript
// Sandbox → UI (already exists, no change)
{ type: 'import-from-yaml-error', payload: { error: string } }
```

## Plugin Data

No changes to plugin data storage.
