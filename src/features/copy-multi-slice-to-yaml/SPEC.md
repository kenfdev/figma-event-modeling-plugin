# CopyMultiSliceToYaml Feature

## Action Name

`copy-multi-slice-to-yaml`

## Activation Condition

When a generic FigJam SECTION node (wrapping section) that wraps one or more Slice sections is selected, a "Copy to YAML" button appears in the ElementEditor. Clicking the button triggers this action.

A wrapping section is a SECTION node where:
- The SECTION itself has no plugin data type (`getPluginData('type') === ''`)
- It has at least one direct child with `pluginData('type') === 'slice'`

## Output Shape

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

## Result/Error Messages

| Outcome | Message Type | Payload |
|---------|-------------|---------|
| Success | `copy-multi-slice-to-yaml-result` | `{ yaml: string }` |
| Node not found | `copy-multi-slice-to-yaml-error` | `{ message: 'Node not found' }` |
| Node not a SECTION | `copy-multi-slice-to-yaml-error` | `{ message: 'Node is not a section' }` |
| No slices found | `copy-multi-slice-to-yaml-error` | `{ message: 'No slices found' }` |
| Unexpected error | `copy-multi-slice-to-yaml-error` | `{ message: 'Unexpected error' }` |

## Edge Cases

- Stale node ID: `getNodeByIdAsync` returns `null` → posts error
- Non-SECTION node selected: posts error
- SECTION with no slice children: posts error
- SECTION with mixed children (sticky, GWT, lane, etc.): only slices are included, others ignored
- Slices with equal x position: stable sort preserves original order
- Empty slices: formatted as YAML with only the slice name

## Dependencies

- `formatSliceAsYaml` from `../export-slice-to-yaml/format`
- `MessageHandlerContext` from `../open-plugin-panel/sandbox`