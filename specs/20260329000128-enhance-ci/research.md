# Research: Enhance CI/CD Pipeline

**Date**: 2026-03-29

## Decision 1: Oxlint Setup

**Decision**: Install `oxlint` npm package, add `npm run lint` script, run with zero config.

**Rationale**: The `oxlint` package auto-selects the correct platform-specific binary via optionalDependencies. It works out of the box with ~90+ correctness-focused rules covering `.ts`, `.tsx`, `.js`, `.jsx` files. No config file needed for initial setup. It's 50-100x faster than ESLint, ideal for CI.

**Alternatives considered**:
- ESLint: Much slower, heavier config burden. Oxlint covers the correctness rules that matter for CI gating.
- Biome: Good alternative but spec explicitly requires oxlint.
- Config file: Not needed initially; can be added later for rule customization.

**Implementation**:
- `npm install -D oxlint`
- Add script: `"lint": "oxlint"`
- CI step: `npm run lint`

## Decision 2: CI Workflow Structure (Parallel Jobs)

**Decision**: 4 parallel independent jobs in a single workflow file: test, typecheck, lint, build.

**Rationale**: GitHub Actions jobs run in parallel by default (no `needs:` required). Each job gets its own clean runner, providing isolated pass/fail status per check on PRs. With `cache: 'npm'` on `actions/setup-node@v4`, each job's `npm ci` takes ~10-15 seconds from warm cache.

**Alternatives considered**:
- Single job with sequential steps: Simpler but slower; one failure blocks subsequent checks from reporting.
- 2-3 grouped jobs: Less granular feedback on PRs.
- Shared install job + artifact passing: Adds complexity and serialization overhead; not faster than parallel `npm ci` with cache.

**Implementation**: Each job repeats: `actions/checkout@v4` → `actions/setup-node@v4` (node 22, cache: npm) → `npm ci` → run check.

## Decision 3: GitHub Release Action

**Decision**: Use `softprops/action-gh-release@v2` for draft release creation and artifact upload.

**Rationale**: `actions/create-release` is archived/unmaintained since 2021. `softprops/action-gh-release@v2` is actively maintained, widely adopted, and handles both release creation and asset upload in a single step. Supports `draft: true` and `generate_release_notes: true`.

**Alternatives considered**:
- `actions/create-release` + `actions/upload-release-asset`: Both archived, requires two steps.
- GitHub CLI (`gh release create`): Works but requires more scripting, less declarative.
- `ncipollo/release-action`: Viable but `softprops` has broader adoption.

## Decision 4: Version Extraction from Git Tag

**Decision**: Extract version from `GITHUB_REF_NAME` by stripping the `v` prefix. No package.json sync required.

**Rationale**: The tag is the source of truth for the release version. Stripping `v` from `GITHUB_REF_NAME` is a one-liner (`${GITHUB_REF_NAME#v}`). Avoids the complexity of keeping package.json version in sync with tags.

**Implementation**:
```yaml
- id: version
  run: echo "VERSION=${GITHUB_REF_NAME#v}" >> "$GITHUB_OUTPUT"
```

## Decision 5: Tag Pattern

**Decision**: Use strict semver pattern `v[0-9]+.[0-9]+.[0-9]+` instead of `v*.*.*`.

**Rationale**: `v*.*.*` would match non-semver tags like `vabc.def.ghi`. The character-class pattern ensures only numeric semver tags trigger the release workflow.

## Decision 6: CI Runner and Node Version

**Decision**: `ubuntu-latest` runner, Node.js 22 LTS (22.x).

**Rationale**: `ubuntu-latest` is the standard free runner for public repos with all needed tools pre-installed (including `zip`). Node 22 LTS matches the project's target runtime per spec clarifications.

## Decision 7: Release Workflow Quality Checks

**Decision**: Release workflow runs quality checks before building the production bundle.

**Rationale**: Catches issues even if someone tags from a non-main branch or if branch protection isn't configured. Small cost (parallel checks add ~30-60 seconds) for significant safety improvement.

## Decision 8: npm ci vs npm install

**Decision**: Use `npm ci` in all CI workflows.

**Rationale**: `npm ci` is faster, stricter, and respects the lockfile exactly. It deletes `node_modules` and installs from scratch based on `package-lock.json`, ensuring reproducible builds.

## Decision 9: Workflow Permissions

**Decision**: Release workflow explicitly sets `permissions: contents: write`. CI workflow uses default (read) permissions.

**Rationale**: Only the release workflow needs write access (to create releases and upload assets). CI quality checks only need read access. Following principle of least privilege.
