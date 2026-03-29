# Implementation Plan: Enhance CI/CD Pipeline

**Feature Spec**: [spec.md](./spec.md)
**Status**: Ready for implementation
**Branch**: `add-ci`
**Date**: 2026-03-29

## Technical Context

| Aspect | Decision |
|--------|----------|
| CI Platform | GitHub Actions |
| Runner | `ubuntu-latest` |
| Node.js | 22 LTS (22.x) |
| Package manager | npm (`npm ci` in CI) |
| Linter | oxlint (zero config, ~90+ correctness rules) |
| Release action | `softprops/action-gh-release@v2` |
| Action versions | `actions/checkout@v4`, `actions/setup-node@v4` |
| CI structure | 4 parallel jobs (test, typecheck, lint, build) |
| Caching | `actions/setup-node` with `cache: 'npm'` |
| Tag pattern | `v[0-9]+.[0-9]+.[0-9]+` (strict semver) |
| Version source | Git tag (strip `v` prefix) |
| Release type | Draft (maintainer publishes after review) |
| Release checks | Quality checks run before release build |

## Artifacts

| File | Purpose |
|------|---------|
| [research.md](./research.md) | Technical decisions and rationale |
| [data-model.md](./data-model.md) | Artifact descriptions and state transitions |
| [contracts/ci-workflow.yml](./contracts/ci-workflow.yml) | CI workflow contract (ready to copy) |
| [contracts/release-workflow.yml](./contracts/release-workflow.yml) | Release workflow contract (ready to copy) |
| [quickstart.md](./quickstart.md) | Step-by-step implementation guide |

## Implementation Slices

### Slice 1: Add oxlint and lint script

**Scope**: FR-1 (partial — linting prerequisite)
**Files changed**:
- `package.json` — add `oxlint` devDependency, add `"lint": "oxlint"` script

**Steps**:
1. `npm install -D oxlint`
2. Add `"lint": "oxlint"` to `scripts` in `package.json`
3. Run `npm run lint` locally to verify it passes (fix any issues)

**Acceptance**: `npm run lint` exits 0

### Slice 2: CI quality gate workflow

**Scope**: FR-1 (PR quality gate), FR-2 (main branch quality)
**Files created**:
- `.github/workflows/ci.yml`

**Steps**:
1. Create `.github/workflows/` directory
2. Create `ci.yml` from [contracts/ci-workflow.yml](./contracts/ci-workflow.yml)
3. Push branch, open PR to verify all 4 jobs run in parallel

**Acceptance**:
- PR shows 4 separate check statuses (test, typecheck, lint, build)
- Push to main triggers the same workflow
- Each check independently reports pass/fail

### Slice 3: Release workflow

**Scope**: FR-3 (release workflow)
**Files created**:
- `.github/workflows/release.yml`

**Steps**:
1. Create `release.yml` from [contracts/release-workflow.yml](./contracts/release-workflow.yml)
2. Test with a throwaway tag (`v0.0.1-test`), verify:
   - Quality checks run first (test, typecheck, lint)
   - Release job runs after checks pass
   - Draft GitHub Release is created
   - Artifact `figma-event-modeling-plugin-v0.0.1-test.zip` is attached
3. Clean up test tag and draft release

**Acceptance**:
- Semver tag push creates a draft release with correctly named zip artifact
- Non-semver tags do not trigger the workflow

### Slice 4: Release documentation

**Scope**: FR-4 (release documentation)
**Files created**:
- `docs/releasing.md`

**Steps**:
1. Create `docs/releasing.md` covering:
   - Preparing a release (what to check before tagging)
   - Creating and pushing a semver tag
   - What CI does automatically (quality checks → production build → draft release)
   - How to review and publish the draft release
   - Manual Figma plugin submission steps
2. Review for accuracy against the implemented workflows

**Acceptance**: A new contributor can follow the guide to execute a release without assistance

## Dependency Graph

```
Slice 1 (oxlint)
    ↓
Slice 2 (CI workflow) ←── depends on lint script existing
    ↓
Slice 3 (Release workflow) ←── can be parallel with Slice 2, but easier to verify sequentially
    ↓
Slice 4 (Release docs) ←── references both workflows
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| oxlint flags existing code | Run locally first, fix or suppress rules before adding to CI |
| Plugma build fails in CI | Verify `npm run build` works in a clean `npm ci` install locally |
| Release workflow permissions | Explicitly set `permissions: contents: write` |
| Tag pattern too strict/loose | Using `v[0-9]+.[0-9]+.[0-9]+` — covers standard semver, excludes pre-release tags intentionally |

## Out of Scope (per spec)

- Branch protection rule configuration
- Code coverage thresholds
- Changelog auto-generation
- Automated Figma marketplace submission
- Deployment previews
