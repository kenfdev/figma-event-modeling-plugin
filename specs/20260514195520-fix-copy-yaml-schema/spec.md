# Spec: Align Slice-to-YAML Copy Output with Import Schema

## Overview

The plugin currently lets users copy a Slice (or a group of Slices) as YAML, but the emitted YAML no longer matches the schema the plugin's importer accepts. The output still places events at the top level and omits the Screen block that the importer now requires, so a YAML produced by Copy cannot be pasted back to recreate the same Event Model. This feature realigns the Copy-to-YAML output with the importer's current schema so that the round-trip — model on canvas → copied YAML → imported back — reliably reconstructs an equivalent model.

**Target users**: Event modelers using the FigJam plugin who copy slices to YAML to share, version, archive, or re-import their Event Models.

## User Stories

- As an event modeler, I want the YAML produced by Copy to be accepted by the plugin's own Import flow without manual editing, so that I can reliably round-trip my models.
- As an event modeler, I want every command's resulting events to appear under that command in the copied YAML, so that the export preserves the cause-and-effect structure I drew on the canvas.
- As an event modeler, I want the Screen in my slice (including images I marked as Screen) and the queries it reads and commands it executes to be captured in the copied YAML, so that re-importing reproduces the same screen wiring.
- As an event modeler, I want queries in the copied YAML to record which events they project from, so that read-side derivations survive the round-trip.
- As an event modeler, I want to be told plainly when something on the canvas could not be represented in the YAML output, so that I can fix the model and re-copy instead of silently losing information.

## Functional Requirements

- The copied YAML for a single slice and for a multi-slice copy MUST conform to the same schema the plugin's importer accepts today.
- Each slice document in the output MUST include a `screen` block. If the slice contains a Screen element (either a Screen shape created by the plugin or an image marked as Screen), that element provides the screen's identity for the output. If the slice has no Screen element, the output MUST still include a minimal Screen block sufficient for the importer to accept it, with no reads and no executes.
- Each command in the output MUST list, under `produces`, the events that the model shows as being produced by that command. Production is determined by connectors drawn from the command to events within the same slice.
- Each query in the output MUST list, under `from_events`, the events that the model shows as feeding the query. The relationship is determined by connectors drawn from events to the query within the same slice.
- The Screen block MUST list, under `reads`, the queries reachable from the Screen via connectors, and, under `executes`, the commands reachable from the Screen via connectors, all scoped to the same slice.
- The output MUST NOT include a top-level `events` collection. Events that cannot be attributed to any command in the slice — for example, events with no connector linking them to a command — MUST be omitted from the output, and the user MUST be informed that one or more events were skipped and why, so the omission is not silent.
- Events flagged on the canvas as "external" MUST be exported as ordinary events. The exporter MUST NOT emit any flag, key, or marker that distinguishes external events in the output, because the importer schema no longer recognizes such a distinction.
- All optional keys (such as fields, notes, description, reads, executes, produces, from_events) MUST be omitted when empty, so the output stays minimal and readable.
- Multi-slice copy MUST emit one schema-valid document per slice, separated as it is today, with each document carrying its own Screen block and its own derived relationships.
- The visible Copy action, its trigger conditions, its activation rules, and the clipboard / toast behavior remain unchanged from the current Copy-to-YAML implementation; only the content of the YAML changes.

## Success Metrics

- Any model copied to YAML can be re-imported by the same plugin and produce a model equivalent in slice name, screen presence, commands, queries, GWT sections, and the command-produces-event / query-from-events / screen-reads / screen-executes relationships.
- Zero schema-validation errors are reported by the importer when handed YAML that was just copied, across a representative sample of models including: empty slice, slice with only commands, slice with full screen + commands + queries + GWT, and multi-slice copy.
- When the user copies a slice that contains events with no producing command, the user sees a clear notification identifying that information was dropped, on every such copy.
- The fraction of "copy then re-import" cycles that succeed without manual YAML editing reaches effectively 100% for models the user authored entirely within the plugin.

## Out of Scope

- Adding or changing UI surface: no new buttons, no relocation of the Copy action, no new menu entries.
- Changing the import-from-YAML schema or behavior. This work changes only what the exporter emits.
- Inferring missing relationships from anything other than connectors (for example, spatial proximity, naming heuristics, or ordering). Models without the necessary connectors will emit minimal Screen blocks and drop orphan events, as described above.
- Preserving the canvas concept of "external" events through the YAML round-trip. External events become ordinary events on export and are recreated as ordinary events on import.
- Bulk repair tooling for existing models that lack connectors. Users author the connectors they need; the exporter does not synthesize them.
- Export formats other than YAML (Markdown export, JSON, etc.).

## Constraints

- The round-trip target is the plugin's own current importer. If the importer's schema evolves later, this exporter must follow.
- The output must remain valid YAML and must continue to be safe to place on the system clipboard from within the plugin sandbox.
- The exporter operates only on data visible within the selected slice (or, for multi-slice copy, within each selected slice). It does not consult elements outside the slice when deriving relationships.
- Deferred: how to communicate, beyond a single toast, multiple distinct categories of skipped content in one copy operation (for example, both orphan events and a screen with no connectors at once). The first release uses a single short notification; richer reporting is left for a later iteration.
