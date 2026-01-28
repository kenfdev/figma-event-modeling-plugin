# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FigJam plugin for creating Event Modeling diagrams. Uses TypeScript + React + Vite + Plugma stack targeting FigJam (not Figma Design).

## Commands

```bash
npm run dev          # Start dev server with HMR (Plugma auto-rebuilds on changes)
npm run build        # Build plugin
npm run release      # Production build
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
```

Note: UI changes appear instantly via HMR. Main thread (`src/main.ts`) changes require plugin restart in Figma.

## Architecture

### Directory Structure

```
src/
  main.ts                          # Plugin sandbox entry (imports handlers from features)
  ui/
    main.tsx                       # React entry point
  shared/
    types/                         # Shared TypeScript types
      plugin.ts
    styles/                        # Global CSS styles
      global.css
    test/                          # Test utilities
      setup.ts                     # Vitest setup
      mocks/
        figma.ts                   # Figma API mock
  features/
    <feature-name>/                # Feature-sliced directory
      index.ts                     # UI exports (for src/ui/)
      sandbox.ts                   # Sandbox exports (for src/main.ts)
      Component.tsx                # React components
      Component.test.tsx           # Component tests
      handlers.ts                  # Sandbox message handlers
      handlers.test.ts             # Handler tests
```

### Feature-Sliced Architecture

Each feature is self-contained in `src/features/<feature-name>/`:
- All related code (components, handlers, tests, types) lives together
- **`index.ts`**: UI exports (React components) - import in `src/ui/` only
- **`sandbox.ts`**: Sandbox exports (message handlers) - import in `src/main.ts` only
- Shared code (types, utilities, test helpers) lives in `src/shared/`

**IMPORTANT**: The sandbox cannot use React. Never import from `index.ts` in `main.ts` - always use `sandbox.ts`.

### Figma Plugin Model

Two separate execution contexts communicate via message passing:

1. **Plugin Sandbox** (`src/main.ts`): Runs in Figma's main thread with Figma API access. Creates elements, reads/writes plugin data, handles selection. Imports handlers from features.

2. **UI Thread** (`src/ui/`): React application in an iframe. No direct Figma API access. Communicates with sandbox via `parent.postMessage()` and receives via `onmessage`.

### Message Protocol

```typescript
// UI → Sandbox
parent.postMessage({ pluginMessage: { type: 'action-name', payload: data } }, '*')

// Sandbox → UI
figma.ui.postMessage({ type: 'response-type', payload: data })
```

### Plugin Data Storage

Elements store metadata in Figma's plugin data system:
```typescript
node.setPluginData('type', 'command')  // Store
node.getPluginData('type')              // Retrieve
```

### Key Types (`src/shared/types/plugin.ts`)

- `ElementType`: 'command' | 'event' | 'query' | 'actor'
- `StructuralType`: 'lane' | 'chapter' | 'processor' | 'screen'
- `SectionType`: 'slice' | 'gwt'
- `ElementData`: Shape data with type and label
- `PluginMessage`: UI-to-plugin message format

## Testing

Uses Vitest + React Testing Library. Tests live alongside feature code.

```bash
npm run test         # Watch mode
npm run test:run     # Single run
```

### Figma API Mocking

Tests use `src/shared/test/mocks/figma.ts` to mock the Figma API:

```typescript
import { createFigmaMock, resetFigmaMock } from '../../shared/test/mocks/figma'

beforeEach(() => {
  resetFigmaMock() // Reset to fresh mock
})
```

## Element Types

| Element | Color | Size |
|---------|-------|------|
| Command | #4A90D9 (blue) | 200×120px |
| Event (internal) | #F5A623 (orange) | 200×120px |
| Event (external) | #9B59B6 (purple) | 200×120px |
| Query | #7ED321 (green) | 200×120px |
| Actor | #50E3C2 (teal) | 200×120px |
| Lane | Light gray 5% opacity | Half viewport width × 120px |
| GWT | - | 400×600px parent, 350×180px children |

## Specification Documents

- `docs/spec.md`: Complete feature specification (element types, UI, export/import formats, keyboard shortcuts)
- `docs/slices/`: Implementation roadmap with 31 feature slices across 11 phases

## Debugging

- **UI Console**: Figma → Plugins → Development → Open console
- **Main Console**: `console.log` in `main.ts` appears in Figma's plugin console
