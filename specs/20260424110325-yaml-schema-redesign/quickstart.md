# Quickstart: YAML Import Schema Redesign

**Created**: 2026-04-24

## Prerequisites

```bash
npm install   # no new dependencies — js-yaml already bundled
npm run dev   # Plugma dev server with HMR
```

## Files to Create

| Path | Purpose |
|---|---|
| `src/shared/figma/connectors.ts` | Shared connector creation helper (R5) |
| `src/shared/figma/connectors.test.ts` | Unit tests for helper |
| `src/features/import-from-yaml/name-match.ts` | `normalizeName()` for FR-8 (or keep inline in parser.ts with tests) |
| `src/features/import-from-yaml/ResolutionFlow.tsx` | In-panel resolution UI (R3) |
| `src/features/import-from-yaml/ResolutionFlow.test.tsx` | Component tests |
| `src/features/import-from-yaml/index.ts` | Export `ResolutionFlow` for Panel (if not already exporting UI) |

## Files to Modify

| Path | Change |
|---|---|
| `src/features/import-from-yaml/SPEC.md` | Rewrite for new schema |
| `src/features/import-from-yaml/parser.ts` | New schema types; new validation (FR-1/2/3/4/6/8); drop `events`/`external` |
| `src/features/import-from-yaml/parser.test.ts` | Replace legacy schema tests with new cases incl. error paths |
| `src/features/import-from-yaml/handlers.ts` | Sandbox: create screen/processor; pre-scan canvas events; draw in-slice connectors; emit `import-resolution-needed`; apply answers; handle `focus-node` |
| `src/features/import-from-yaml/handlers.test.ts` | Extensive new coverage for connectors, phases, modals, focus |
| `src/features/import-from-yaml/template.ts` | Clipboard template for new schema |
| `src/features/import-from-yaml/template.test.ts` | Template round-trip through parser |
| `src/features/import-from-yaml/sandbox.ts` | Export new handlers (`focus-node`, `import-resolution-answered`) |
| `src/features/connect-elements/handlers.ts` | (Optional) use shared helper |
| `src/features/open-plugin-panel/Panel.tsx` | Wire in `ResolutionFlow`; handle `import-resolution-needed`; parse in UI; send `import-from-yaml { data }` |
| `src/features/open-plugin-panel/*.test.tsx` | Cover new UI state (awaiting-answers, prompts, success) |
| `src/main.ts` | Register the new message types |
| `sample-import.yaml` | Rewrite to new schema (FR-7.2) |
| `docs/spec.md` | Add new row to Feature Index / update existing import row |

## Verification

```bash
npm run test:run
npm run build
```

## Manual Test Plan

Because the import flow is intrinsically UI+sandbox, verify in FigJam after `npm run dev`:

1. **Register User happy path** — Paste the brief's example YAML. Expect: slice with Screen top-center, RegisterUser command, UserRegistered event, ExistingUserByEmail query, all four connectors drawn, no modals.
2. **Processor variant** — Change `screen.type` to `system` and `name` to `Email Dispatcher`. Expect: a Processor shape in the top row with a matching label.
3. **Cross-slice match** — Import the Register User slice first. Then import a second slice whose query's `from_events: [UserRegistered]` references it. Expect: Phase 4 modal lists the existing UserRegistered event with parent slice "Register User" and a Focus button. Click Focus — viewport pans. Click Confirm — connector drawn.
4. **Multiple candidates** — Create two events both labeled `UserRegistered` in different slices manually. Import a slice referencing `UserRegistered`. Expect: two candidates, each with its own Focus button.
5. **No match — Create** — Import a slice referencing `TotallyNew` in `from_events`. Expect: "Create event?" modal. Click Create. Expect: new orange event in the current slice plus Event→Query connector.
6. **No match — Skip** — Repeat step 5, click Skip. Expect: query exists, no event, no connector.
7. **Reuse after Create** — Import a slice with two queries both `from_events: [SharedEvent]`, nothing matches. Expect: one "Create event?" modal; second query connects silently.
8. **Validation errors** — Try each error path: missing `screen`, invalid `screen.type: agent`, unknown `reads`, unknown `executes`, duplicate commands, legacy `events:` block. Each should show inline error and create nothing.
9. **Unknown key warning** — Add `bogus: 123` at top level. Expect: import succeeds, warning logged to plugin console.
10. **Focus resilience** — During a cross-slice modal, delete the candidate event in FigJam manually, then click Focus. Expect: no crash, warning logged.

## Deployment

Plugin-only change. No server-side pieces. `npm run build` produces the bundled plugin; ship in the next `npm run release`.
