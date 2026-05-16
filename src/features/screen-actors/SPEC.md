# Feature: Screen Actors

Adds an optional list of actor names to user-screens. Editable from the panel when a user-screen is selected; persisted via plugin data; included in YAML export and import. System-screens (processors) never expose or store this property.

## Acceptance Criteria

- Selecting a user-screen reveals an editable actor list in the panel.
- Authors can add, edit, and remove actor entries.
- Actors persist across selection changes, plugin reloads, and file saves.
- System-screens show no actor controls and never store actor data.
- Clearing all actors returns the screen to the "not specified" state — no residual `actors` plugin data key.
- Canvas appearance is unaffected.
- YAML export of a user-screen with actors includes an `actors` field on the screen block.
- YAML import restores actors on the recreated screen.
- Legacy YAML without actors loads cleanly with no actors set.

## Technical Notes

- Storage: `pluginData.actors` as `JSON.stringify(string[])`. When the list becomes empty, the key is cleared with `setPluginData('actors', '')`.
- Message: `update-screen-actors` carries `{ id, actors: string[] }`. The UI sends the full list after each mutation.
- Selection payload: when `type === 'screen'`, the payload includes `actors: string[]` parsed from plugin data.
- YAML: `screen.actors: string[]`, emitted only for user-screens and only when non-empty.
