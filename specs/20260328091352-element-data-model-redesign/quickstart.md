# Quickstart: Element Data Model Redesign

## Prerequisites
- Node.js installed
- `npm install` completed
- Familiarity with the feature-sliced architecture (see CLAUDE.md)

## Getting Started

```bash
# Run tests in watch mode during development
npm run test

# Run tests once
npm run test:run

# Build plugin
npm run build

# Dev server with HMR
npm run dev
```

## Implementation Order

Start with Phase 1 (removals) and work sequentially:

1. **Phase 1**: Delete `toggle-fields-visibility` and `detect-drift` features, clean up all references
2. **Phase 2**: Modify `handleSelectionChange` to sync canvas text → plugin data
3. **Phase 3**: Build `CustomFieldsEditor` component, update field storage to YAML format
4. **Phase 4**: Build `export-slice-to-yaml` feature

> **Note**: Phase 5 (Screen Image Placeholder / FR-5) was descoped — FigJam's drop API is not native support.

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/main.ts` | Plugin sandbox entry — registers all handlers |
| `src/features/view-selected-element/handlers.ts` | Selection handler — where canvas sync goes |
| `src/features/view-selected-element/ElementEditor.tsx` | Main editor UI — where fields UI changes |
| `src/features/open-plugin-panel/Panel.tsx` | Root panel component — message routing |
| `src/features/import-from-yaml/handlers.ts` | Import handler — needs field format conversion |
| `src/features/export-slice-to-markdown/handlers.ts` | Export handler — needs field format parsing update |

## Testing Approach

- **TDD** for all new features (write tests first)
- **Delete** tests alongside removed features (no need to test removals)
- Mock Figma API using `src/shared/test/mocks/figma.ts`
