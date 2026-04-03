# Quickstart: UX Polish Batch

**Created**: 2026-04-03

## Prerequisites

```bash
npm install   # Install dependencies (no new dependencies needed)
npm run dev   # Start dev server
```

## Files to Modify

### Sandbox handlers (shape type change)
- `src/features/create-command/handlers.ts`
- `src/features/create-event/handlers.ts`
- `src/features/create-query/handlers.ts`
- `src/features/create-actor/handlers.ts`
- `src/features/import-from-yaml/handlers.ts`

### Sandbox handlers (positioning)
- `src/features/update-slice-issue-url/handlers.ts`

### UI components
- `src/features/open-plugin-panel/Panel.tsx`

### Styles
- `src/shared/styles/global.css`

### Tests
- `src/features/create-command/handlers.test.ts`
- `src/features/create-event/handlers.test.ts`
- `src/features/create-query/handlers.test.ts`
- `src/features/create-actor/handlers.test.ts`
- `src/features/import-from-yaml/handlers.test.ts`
- `src/features/update-slice-issue-url/handlers.test.ts`
- `src/features/open-plugin-panel/SettingsPanel.test.tsx`

## Verification

```bash
npm run test:run    # All tests pass
npm run build       # Build succeeds
```
