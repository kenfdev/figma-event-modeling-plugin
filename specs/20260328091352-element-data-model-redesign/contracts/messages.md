# Message Contracts: Element Data Model Redesign

## UI → Sandbox Messages

### update-custom-fields (modified)
```typescript
{
  type: 'update-custom-fields'
  payload: {
    id: string           // Node ID
    customFields: string  // YAML string: "fields:\n  - name: type\n  ..."
  }
}
```

### export-slice-to-yaml (new)
```typescript
{
  type: 'export-slice-to-yaml'
  payload: {
    id: string  // Slice node ID
  }
}
```

### Removed Messages
- `toggle-fields-visibility` — FR-3
- `sync-drift` — FR-4

## Sandbox → UI Messages

### selection-changed (modified)
```typescript
{
  type: 'selection-changed'
  payload: {
    id: string
    type: ElementType | StructuralType | SectionType
    name: string          // Now sourced from canvas text (synced to plugin data)
    customFields: string  // YAML format
    notes: string
    external: boolean
    // fieldsVisible: REMOVED
    issueUrl: string
    pluginData: Record<string, string>
  } | { multiple: true } | null
}
```

### export-slice-to-yaml-result (new)
```typescript
{
  type: 'export-slice-to-yaml-result'
  payload: {
    yaml: string  // Full YAML string matching import-from-yaml schema
  }
}
```

### Removed Messages
- `drift-detected` — FR-4

## Export YAML Schema (output format)

Mirrors the import-from-yaml schema for round-trip compatibility:
```yaml
slice: SliceName

commands:
  - name: CommandName
    fields: |
      fieldName: type
    notes: optional notes

events:
  - name: EventName
    external: false
    fields: |
      fieldName: type
    notes: optional notes

queries:
  - name: QueryName
    fields: |
      fieldName: type

gwt:
  - name: GWT Section Name
    description: optional description text
    given:
      - name: ElementName
        type: command | event | query | error
        fields: |
          fieldName: type
    when:
      - name: ElementName
        type: command | event | query | error
    then:
      - name: ElementName
        type: command | event | query | error
```

Note: Custom fields in the export YAML use block string format (`fields: |`) to match the import schema, even though internal storage uses YAML array format. The export handler converts between formats.
