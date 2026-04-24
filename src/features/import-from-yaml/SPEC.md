# Import from YAML

## Type
Command

## Status
Done

## Description
Read YAML from clipboard, validate against the new schema (screen block, produces, from_events), create Slice with elements arranged in columns, draw all connectors (Query→Screen, Screen→Command, Command→Event, Event→Query), and prompt for cross-slice from_events resolutions.

## User Story
As a user, I want to import an Event Model definition from YAML to quickly create a fully-wired slice where every element is placed in the correct column, connectors are drawn automatically in the correct direction, and cross-slice event references are resolved via prompts.

As a user, I want to copy a YAML template to my clipboard so I can quickly start writing a valid YAML definition without memorizing the schema.

## Acceptance Criteria
- "Import from Clipboard" button visible in panel
- Clicking button reads YAML from system clipboard
- YAML is validated against the new schema; specific errors reported for invalid content
- Valid YAML creates:
  - Slice section with specified name
  - Screen element (type: user → Screen; type: system → Processor) placed in top row above Commands, horizontally centered
  - Command elements from `commands` array
  - Event elements created from `commands[].produces` (one event per name, placed in Events column)
  - Query elements from `queries` array
  - GWT sections from `gwt` array with Given/When/Then child sections containing colored element shapes
- Connectors drawn automatically in the correct direction:
  - Query → Screen (for each name in screen.reads)
  - Screen → Command (for each name in screen.executes)
  - Command → Event (for each name in commands[].produces)
  - Event → Query (for same-slice produces and user-confirmed cross-slice/no-match events)
- Phase 4 cross-slice resolution:
  - For from_events names with no same-slice match: search canvas for matching event shapes
  - If canvas candidates exist: show modal listing each candidate with parent slice name and Focus button; on confirm draw Event→Query from chosen candidate; on dismiss draw nothing
  - If no canvas match exists: show "Create event?" modal; on Create spawn new internal event in current slice and draw connector; on Skip draw nothing
- Screen.reads names must match query names in the same slice (case-insensitive, whitespace-normalized)
- Screen.executes names must match command names in the same slice (case-insensitive, whitespace-normalized)
- GWT sections contain colored element shapes (type-specific fill/stroke colors); no connectors drawn inside GWT sections
- Custom fields and notes imported from YAML (top-level elements; GWT items support fields but not notes)
- error element type supported inside GWT sections
- Document/template icon button copies the new YAML template to clipboard
- Unknown top-level keys (other than removed legacy events/external) produce console warnings but do not fail import

## Dependencies
- F1.1-F1.3: Command, Event, Query creation
- F4.4: CreateScreen (type: user)
- F4.3: CreateProcessor (type: system)
- F5.1: CreateSlice
- F5.2: CreateGWT
- F16.3: ConnectElements (for connector drawing)

## Technical Notes

### YAML Schema (New)
```yaml
slice: Register User

screen:
  type: user                    # required: 'user' | 'system'
  name: Sign Up                 # optional: display label; defaults to "Screen" / "Processor"
  reads:                        # optional: query names this screen reads from
    - ExistingUserByEmail
  executes:                     # optional: command names this screen executes
    - RegisterUser

commands:
  - name: RegisterUser
    fields: |
      email: string
      password: string
    notes: Customer fills in sign-up form
    produces:                   # optional: event names this command produces in this slice
      - UserRegistered

queries:
  - name: ExistingUserByEmail
    fields: |
      email: string
    from_events:                # optional: event names this query is constructed from
      - UserRegistered

gwt:
  - name: Happy Path
    given:
      - name: ExistingUserByEmail
        type: query
    when:
      - name: RegisterUser
        type: command
    then:
      - name: UserRegistered
        type: event
```

### Top-Level Keys
- `slice` (required): string — slice section name
- `screen` (required): object — exactly one; see Screen block below
- `commands` (optional): array of Command objects
- `queries` (optional): array of Query objects
- `gwt` (optional): array of GWT objects (unchanged from previous version)

### Screen Block
- `type` (required): `"user"` | `"system"` — user creates a Screen element; system creates a Processor element
- `name` (optional): display label; defaults to "Screen" (user) or "Processor" (system)
- `reads` (optional): array of query names this screen reads from
- `executes` (optional): array of command names this screen executes

### Connector Directions (FR-5)
| Relationship | Connector Direction |
|---|---|
| screen.reads[] | Query → Screen |
| screen.executes[] | Screen → Command |
| commands[].produces[] | Command → Event |
| queries[].from_events[] (same-slice) | Event → Query |
| queries[].from_events[] (cross-slice, confirmed) | Event → Query |
| queries[].from_events[] (no-match, created) | Event → Query |

No connectors are drawn to/from Actor elements or inside GWT sections.

### Import Phases (FR-9)
1. **Phase 1 — Parse & validate**: Any failure aborts here; nothing drawn on canvas
2. **Phase 2 — Create in-slice shapes**: Slice section, screen/processor, commands, events (from produces), queries, GWT sections
3. **Phase 3 — Draw in-slice connectors**: Query→Screen, Screen→Command, Command→Event, same-slice Event→Query
4. **Phase 4 — Post-shape prompts**: Sequential modals:
   - Cross-slice first (FR-4.3): for each from_events with canvas candidates but no same-slice match
   - No-match second (FR-4.4): for each from_events with no candidate anywhere; Create spawns event + connector, Skip draws nothing

### Name Matching (FR-8)
All name comparisons are case-insensitive and whitespace-normalized. Trimming, collapsing internal whitespace, and lowercasing are applied before comparison. Shapes are labeled with the original YAML spelling.

### Duplicate Detection
Any duplicate within a single list fails validation:
- Two entries in `commands[]` with the same name
- Two entries in `queries[]` with the same name
- Two entries in any `produces` array with the same name
- Two entries in any `from_events` array with the same name
- Two entries in `screen.reads` with the same name
- Two entries in `screen.executes` with the same name

### Legacy Keys
- `events` top-level array: hard error; import fails with message pointing to `commands[].produces`
- `external` flag anywhere: hard error; import fails with migration message

### GWT Layout
- Given/When/Then child sections auto-resize to fit element shapes
- Elements arranged in a 2-column grid (176px wide elements, wrapping after 2 per row)
- GWT parent section auto-resizes to fit all children

### Error Element Type
- `ElementType`: `'error'`
- Color: fill #FF4444, stroke #CC0000 (red)
- Size: 176×80px
- Only appears inside GWT sections
- Stroke weight: 2

### Validation Errors (examples)
- `"Unknown query name in screen.reads: 'ExistingUserByEmail'"`
- `"Unknown command name in screen.executes: 'RegisterUser'"`
- `"Invalid screen.type 'agent' — expected 'user' or 'system'"`
- `"Missing required 'screen' block"`
- `"Top-level 'events' is no longer supported; use commands[].produces instead"`
- `"Duplicate command name 'RegisterUser' in commands[]"`
- `"Duplicate event name 'UserRegistered' in produces of command 'RegisterUser'"`
