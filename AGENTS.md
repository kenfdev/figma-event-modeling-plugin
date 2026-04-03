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
      SPEC.md                      # Feature specification
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
- **`SPEC.md`**: Feature specification with acceptance criteria and technical notes
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

### Sandbox Message Contract

Every sandbox message handler must emit exactly one `figma.ui.postMessage(...)` call on both success and error paths. This keeps the UI synchronized with sandbox state.

**Naming convention**: `<action>-success` / `<action>-error`

```typescript
// CORRECT: always posts a response
figma.ui.postMessage({ type: 'selection-changed', payload: ... })
return

// WRONG: silently returns without posting
if (!node) return
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
node.text.characters = name
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

All exported message handlers must have test coverage, not just the feature's core logic.

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

### React act(...) Warnings

`act()` warnings indicate real async issues in tests, not cosmetic noise. Fix the underlying async patterns rather than suppressing them.

Preferred utilities:
- `findBy*` queries (automatically wait)
- `waitForElementToBeRemoved`
- `waitFor`
- `act(() => vi.advanceTimersByTime(n))` for timer-based code

Last resort only: `vi.spyOn(console, 'error')` suppression.

## Element Types

| Element | Color | Size |
|---------|-------|------|
| Command | #3DADFF fill, #007AD2 stroke (blue) | 176×80px |
| Event (internal) | #FF9E42 fill, #EB7500 stroke (orange) | 176×80px |
| Event (external) | #9B59B6 (purple) | 176×80px |
| Query | #7ED321 (green) | 176×80px |
| Actor | #50E3C2 (teal) | 176×80px |
| Lane | Light gray 5% opacity | Half viewport width × 120px |
| GWT | - | 400×600px parent, 350×180px children |

## Specification Documents

- `docs/spec.md`: Overview specification with element types, color/sizing reference, technical behavior, and feature index table
- `src/features/<name>/SPEC.md`: Detailed feature specifications colocated with source code

## Debugging

- **UI Console**: Figma → Plugins → Development → Open console
- **Main Console**: `console.log` in `main.ts` appears in Figma's plugin console

## Claude Code Rules

When creating or modifying React components in `src/features/*/` that have visual UI elements, use the `frontend-design` skill to ensure high-quality, polished design.

When a feature is fully implemented (all acceptance criteria met, tests passing), immediately update `docs/spec.md` to mark the feature's Status column as `Done` in the Feature Index table.

When implementing a new feature:
1. Create `src/features/<feature-name>/` directory with `SPEC.md`
2. Add a row to the Feature Index table in `docs/spec.md`
3. Implement the feature following the feature-sliced architecture
4. Mark status as Done in `docs/spec.md` when complete
