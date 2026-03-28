# Quickstart: Plugin UX Enhancements

## Prerequisites

- Node.js installed
- `npm install` completed in project root

## Dev Loop

```bash
npm run dev          # Start dev server with HMR
npm run test         # Watch mode tests
npm run test:run     # Single test run
```

## Implementation Sequence

### Slice 1: Panel Height
```bash
# Edit: src/features/open-plugin-panel/init.ts
# Test: src/features/open-plugin-panel/init.test.ts
npx vitest run src/features/open-plugin-panel/init.test.ts
```

### Slice 2: Screen Simplification
```bash
# Edit: src/features/create-screen/handlers.ts
# Test: src/features/create-screen/handlers.test.ts
npx vitest run src/features/create-screen/
```

### Slice 3: Connect Elements
```bash
# Create: src/features/connect-elements/ (handlers, sandbox, SPEC.md)
# Edit: src/features/view-selected-element/ (handlers + ElementEditor)
# Edit: src/features/open-plugin-panel/Panel.tsx (pass count)
# Edit: src/main.ts (register handler)
npx vitest run src/features/connect-elements/ src/features/view-selected-element/
```

### Slice 4: Copy Element to YAML
```bash
# Create: src/features/copy-element-to-yaml/ (handlers, sandbox, SPEC.md)
# Edit: src/features/view-selected-element/ElementEditor.tsx (add button)
# Edit: src/features/open-plugin-panel/Panel.tsx (handle result message)
# Edit: src/main.ts (register handler)
npx vitest run src/features/copy-element-to-yaml/ src/features/view-selected-element/
```

### Final Verification
```bash
npm run test:run     # All tests pass
npm run build        # Build succeeds
```
