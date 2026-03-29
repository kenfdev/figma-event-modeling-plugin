# Tasks: Enhance CI/CD Pipeline

**Feature**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Branch**: `add-ci`
**Generated**: 2026-03-29

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 4 |
| Phases | 3 (Setup, User Stories, Polish) |
| Parallel opportunities | T003 can run parallel with T002 after T001 completes |
| MVP scope | T001 + T002 (PR quality gate working) |

## Phase 1: Setup

**Goal**: Install oxlint and add the lint script so CI workflows can reference it.

- [ ] T001 [US1] Install oxlint as devDependency and add `"lint": "oxlint"` script in `package.json`. Run `npm run lint` locally and fix any lint errors in existing code. **Acceptance**: `npm run lint` exits 0.

**Context for T001**:
- Run `npm install -D oxlint`
- Add `"lint": "oxlint"` to the `scripts` section of `package.json`
- Run `npm run lint` and fix any flagged issues in `src/`
- Do NOT add an oxlint config file — use defaults

## Phase 2: User Stories

### US-1: Developer Opens a Pull Request (FR-1, FR-2)

**Goal**: Automated quality checks run on every PR and push to main.
**Test criteria**: Push a branch, open a PR → 4 parallel checks (test, typecheck, lint, build) appear as separate statuses.

- [ ] T002 [US1] Create CI quality gate workflow at `.github/workflows/ci.yml` with 4 parallel jobs (test, typecheck, lint, build) triggered on PRs and pushes to main. **Acceptance**: Workflow runs 4 parallel jobs; each reports independent pass/fail.

**Context for T002**:
- Create `.github/workflows/` directory
- Use the contract at `specs/20260329000128-enhance-ci/contracts/ci-workflow.yml` as the source
- 4 jobs: `test` (`npm run test:run`), `typecheck` (`npx tsc --noEmit`), `lint` (`npm run lint`), `build` (`npm run build`)
- Each job: `actions/checkout@v4` → `actions/setup-node@v4` (node-version: 22, cache: npm) → `npm ci` → run check
- Triggers: `push` to `main`, `pull_request` (all branches)
- No explicit permissions needed (read-only default is sufficient)

### US-3: Maintainer Creates a Release (FR-3)

**Goal**: Pushing a semver tag triggers automated production build and draft GitHub Release.
**Test criteria**: Push a `v*.*.*` tag → quality checks pass → draft release created with zip artifact.

- [ ] T003 [P] [US3] Create release workflow at `.github/workflows/release.yml` triggered by semver tags, with quality checks followed by production build, zip, and draft GitHub Release. **Acceptance**: Pushing a semver tag creates a draft release with `figma-event-modeling-plugin-v{version}.zip` attached.

**Context for T003**:
- Use the contract at `specs/20260329000128-enhance-ci/contracts/release-workflow.yml` as the source
- Tag trigger: `v[0-9]+.[0-9]+.[0-9]+` (strict semver, NOT `v*.*.*`)
- Set `permissions: contents: write` at workflow level
- Quality check jobs (test, typecheck, lint) run in parallel — same config as CI workflow
- `release` job has `needs: [test, typecheck, lint]` — runs only after all checks pass
- Release job steps: checkout → setup-node → `npm ci` → `npm run release` → extract version from tag (`${GITHUB_REF_NAME#v}`) → zip dist/ → create draft release via `softprops/action-gh-release@v2`
- Zip command: `cd dist && zip -r "../figma-event-modeling-plugin-v${VERSION}.zip" .`
- Release action config: `draft: true`, `generate_release_notes: true`

### US-4: Contributor Wants to Understand the Release Process (FR-4)

**Goal**: A concise release guide exists so any contributor can execute a release.
**Test criteria**: A new contributor can follow the guide end-to-end without asking questions.

- [ ] T004 [US4] Create release documentation at `docs/releasing.md` covering tag creation, CI automation, draft release review, and manual Figma submission. **Acceptance**: Guide is accurate, step-by-step, and covers the full release lifecycle.

**Context for T004**:
- Create `docs/` directory if it doesn't exist
- Sections to include:
  1. **Prerequisites** — what you need before releasing (passing CI on main, decision on version number)
  2. **Creating a release** — how to create and push a semver tag (`git tag v1.0.0 && git push origin v1.0.0`)
  3. **What happens automatically** — CI runs quality checks, builds production bundle, creates draft GitHub Release with zip artifact
  4. **Publishing the release** — maintainer reviews draft release on GitHub, edits release notes if needed, clicks Publish
  5. **Submitting to Figma** — manual steps: download zip from release, extract, upload via Figma desktop app's plugin submission flow
- Keep it concise — aim for a single page that can be read in 2-3 minutes
- Reference the workflow files by path (`.github/workflows/release.yml`)

## Dependencies

```
T001 (oxlint setup)
  ↓
T002 (CI workflow) ─── depends on lint script from T001
T003 (Release workflow) ─── depends on lint script from T001, [P] parallel with T002
  ↓
T004 (Release docs) ─── references both workflows, can start after T002+T003
```

## Parallel Execution

| Phase | Parallel tasks | Why parallel |
|-------|---------------|--------------|
| After T001 | T002, T003 | Different workflow files, no shared state |

## Implementation Strategy

1. **MVP** (T001 + T002): PR quality gate is the highest-value deliverable — every PR gets automated feedback
2. **Release automation** (T003): Adds release workflow once CI is proven working
3. **Documentation** (T004): Written last to accurately describe the implemented workflows
