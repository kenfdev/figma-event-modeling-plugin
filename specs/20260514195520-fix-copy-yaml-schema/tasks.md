# Tasks: Align Slice-to-YAML Copy Output with Import Schema

Spec: [specs/20260514195520-fix-copy-yaml-schema/spec.md](specs/20260514195520-fix-copy-yaml-schema/spec.md)

A single coordinated PR that ships the full alignment.

---

## T001 — Align Copy-to-YAML output with the import schema

- **User Story**: As an event modeler, I want the YAML produced by Copy to be accepted by the plugin's own Import flow without manual editing, so that I can reliably round-trip my models.
- **Spec**: [specs/20260514195520-fix-copy-yaml-schema/spec.md#user-stories](specs/20260514195520-fix-copy-yaml-schema/spec.md#user-stories)
- **Goal**: After this PR, both single-slice copy and multi-slice copy emit YAML that the plugin's importer accepts without manual edits, and that — once re-imported — reconstructs an equivalent model. Every emitted slice carries a Screen block; each command lists the events it produces; each query lists the events it projects from; the Screen lists the queries it reads and the commands it executes. Content that cannot be represented (events with no producing command) is omitted with a clear, non-blocking notification to the user on every such copy.
- **Scope**:
  - In: A Screen block on every emitted slice, derived from the slice's Screen element when present (Screen shape or image marked as Screen) and minimal when absent.
  - In: Removal of the top-level events collection from the output.
  - In: `commands[].produces` derived from connectors going from a command to events within the slice.
  - In: `queries[].from_events` derived from connectors going from events to a query within the slice.
  - In: `screen.reads` and `screen.executes` derived from connectors at the Screen within the slice (identical behavior for Screen shapes and images marked as Screen).
  - In: External-flagged events emitted as ordinary events, with no marker that distinguishes them.
  - In: User-visible, non-blocking notification when one or more events are dropped because they could not be attributed to a command — once per copy operation, not per event.
  - In: Stable, order-preserving output so the same model copies to the same YAML across runs.
  - In: All optional keys (fields, notes, description, reads, executes, produces, from_events) omitted when empty.
  - Out: Changes to the importer schema or behavior; changes to button placement, activation conditions, or clipboard mechanics; spatial / heuristic inference of relationships (connectors only); preserving the external-event concept across round-trip; bulk repair tooling for legacy models; export formats other than YAML; richer per-category drop reporting (deferred per spec).
- **Dependencies**: depends_on: []
- **Acceptance signals**:
  - A model copied to YAML and pasted into Import reconstructs the same slice name, the same Screen presence, the same commands, queries, and GWT, and the same command-produces-event, query-from-events, screen-reads, and screen-executes relationships.
  - A copied YAML produces no schema-validation errors from the importer across the representative sample called out in the spec (empty slice, commands-only, full screen + commands + queries + GWT, multi-slice).
  - A slice containing events that have no connector to any command produces a clear notification on copy that information was dropped; the clipboard still receives the YAML.
  - A slice where every event is attributable produces no such notification.
  - A Screen authored via Mark Image as Screen behaves the same as a Screen shape in the emitted YAML.
  - The same model copied twice in a row produces byte-identical YAML.
- **Size**: L
