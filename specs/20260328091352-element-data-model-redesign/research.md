# Research: Element Data Model Redesign

## R1: FigJam Image API Capabilities for Screen Placeholder — DESCOPED

> **FR-5 descoped**: `figma.on('drop', ...)` is considered a hack, not native platform support. The Screen image placeholder feature will be revisited in a future spec.

**Original Decision**: Use `figma.on('drop', ...)` event to detect image drops on Screen elements, then set an IMAGE fill on the placeholder rectangle.

**Rationale**: FigJam supports all the necessary APIs:
- `figma.createImage(data: Uint8Array)` and `figma.createImageAsync(src: string)` — both available in FigJam
- Image fills on rectangles: `node.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }]` — works in FigJam
- `figma.on('drop', callback)` — fires when files are dropped from outside Figma, provides target node, coordinates, and file bytes via `DropFile.getBytesAsync()`
- No paste event exists in the plugin API, so drop is the primary mechanism

**Approach**:
1. Listen for `drop` events globally
2. When a drop occurs, check if the drop target or nearby node is a Screen element (via plugin data `type: 'screen'`)
3. If the dropped file is an image (PNG, JPG, GIF), create an `Image` from the bytes
4. Replace the Screen's gray rectangle fill with an IMAGE fill using `scaleMode: 'FILL'` to crop to bounds
5. Hide the placeholder SVG icon (remove or set opacity to 0)
6. Keep the label text visible below

**Limitations**:
- Drop events only fire for content dragged from outside Figma (file system, browser), not for moves within canvas
- No paste event — users must drag-and-drop, not paste
- Image max size: 4096x4096 px
- The `documentchange` event could also detect image creation near Screen elements, but requires `loadAllPagesAsync()` and is more complex

**Alternatives considered**:
- Button in the plugin panel to upload an image → More steps for the user, but guaranteed to work. Could be a fallback.
- `documentchange` listener to detect images placed near Screen elements → Complex bounding box detection, fragile, over-engineered.

## R2: YAML Serialization for Custom Fields

**Decision**: Reuse `js-yaml` library (already a dependency via import-from-yaml feature).

**Rationale**: `js-yaml` is already in the project dependency tree. Using it for custom fields storage ensures consistent YAML handling and correctly handles edge cases (field names with special characters, empty values, etc.).

**Format**:
```yaml
fields:
  - userId: string
  - amount: number
  - status: string
```

Serialization: `yaml.dump({ fields: [...] })`
Deserialization: `yaml.load(data)` → extract `fields` array

**Alternatives considered**:
- Hand-rolled serializer: ~20 lines but doesn't handle edge cases (colons in values, quotes, etc.)
- JSON storage: Simpler parsing but loses human-readability in raw plugin data and breaks the "YAML format" spec requirement

## R3: Canvas Text Sync Timing

**Decision**: Sync canvas text → plugin data inside `handleSelectionChange`, which fires on `selectionchange` event.

**Rationale**: FigJam fires `selectionchange` after text editing is committed (when user clicks away from the text edit). This means `node.text.characters` contains the final text when the event fires. Reading and syncing at this point is reliable.

**Edge case**: If a user edits text but never deselects (e.g., switches to another app), the sync won't happen until the next selection. This is acceptable — the plugin data will be stale but the canvas text (source of truth) is correct, and will sync on next selection.

**Alternatives considered**:
- `documentchange` event to detect text changes in real-time → Over-engineered, requires `loadAllPagesAsync()`, fires too frequently
- Timer-based polling → Wasteful, unnecessary given selection-based sync is sufficient
