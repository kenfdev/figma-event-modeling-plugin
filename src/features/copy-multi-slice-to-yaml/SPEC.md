# CopyMultiSliceToYaml Feature

## Action Name

`copy-multi-slice-to-yaml`

## Activation Condition

When a generic FigJam SECTION node (wrapping section) that wraps one or more Slice sections is selected, a "Copy to YAML" button appears in the ElementEditor. Clicking the button triggers this action.

A wrapping section is a SECTION node where:
- The SECTION itself has no plugin data type (`getPluginData('type') === ''`)
- It has at least one direct child with `pluginData('type') === 'slice'`

### Multi-Selection Path

When 2 or more Slice sections are selected simultaneously, the selection handler detects this case and attaches `multiSliceIds: string[]` to the `selection-changed` payload. This causes the ElementEditor to surface an additional "Copy to YAML" button in the multi-select branch.

## Payload Shape

The handler accepts either single-ID or multi-ID payloads:

```typescript
{ id: string } | { ids: string[] }
```

- **`{ id: string }`**: Original path — copies YAML for all slices inside a single wrapping section.
- **`{ ids: string[] }`**: Multi-select path — copies YAML for slices from multiple selected Slice sections, sorted left-to-right by x position.

## Output Shape

### Single-ID path (wrapping section)

The handler collects all slice children, sorts them by x position (left-to-right), formats each using `formatSliceAsYaml`, and joins them with `"\n---\n"`. A trailing newline is appended.

Example output:
```yaml
slice: Slice1
commands:
  - name: DoThing

---
slice: Slice2
events:
  - name: ThingHappened
```

### Multi-ID path (multi-select)

For each id in `ids[]`:
1. Resolve the node via `getNodeByIdAsync`
2. Verify it is a SECTION with `getPluginData('type') === 'slice'`
3. Collect its slice children, sort by x position
4. Format each slice and join with `\n---\n`
5. Join all slice YAMLs from all selected nodes with `\n---\n`

Example output (2 selected slices):
```yaml
slice: SliceA
commands:
  - name: DoThingA

---
slice: SliceB
events:
  - name: ThingHappened
```

## Result/Error Messages

| Outcome | Message Type | Payload |
|---------|-------------|---------|
| Success | `copy-multi-slice-to-yaml-result` | `{ yaml: string }` |
| Node not found | `copy-multi-slice-to-yaml-error` | `{ message: 'Node not found' }` |
| Node not a SECTION (single-id) | `copy-multi-slice-to-yaml-error` | `{ message: 'Node is not a section' }` |
| Non-slice node in selection (ids[]) | `copy-multi-slice-to-yaml-error` | `{ message: 'Selection contains a non-slice node' }` |
| No slices found | `copy-multi-slice-to-yaml-error` | `{ message: 'No slices found' }` |
| Unexpected error | `copy-multi-slice-to-yaml-error` | `{ message: 'Unexpected error' }` |

## Edge Cases

- Stale node ID: `getNodeByIdAsync` returns `null` → posts error
- Non-SECTION node selected: posts error
- SECTION with no slice children: posts error
- SECTION with mixed children (sticky, GWT, lane, etc.): only slices are included, others ignored
- Slices with equal x position: stable sort preserves original order
- Empty slices: formatted as YAML with only the slice name
- In multi-select path: first node to fail validation stops processing and posts error immediately
- In multi-select path: nodes sorted by x before formatting, regardless of `ids[]` order

## Dependencies

- `formatSliceAsYaml` from `../export-slice-to-yaml/format`
- `MessageHandlerContext` from `../open-plugin-panel/sandbox`