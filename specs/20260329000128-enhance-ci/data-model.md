# Data Model: Enhance CI/CD Pipeline

**Date**: 2026-03-29

This feature introduces no runtime data entities. The "data model" consists of configuration files and documentation artifacts that define the CI/CD pipeline behavior.

## Artifacts

### 1. CI Workflow File

- **Path**: `.github/workflows/ci.yml`
- **Purpose**: Quality gate for PRs and main branch
- **Trigger events**: `pull_request` (all branches), `push` to `main`
- **Jobs**: test, typecheck, lint, build (parallel)
- **Relationships**: References npm scripts defined in `package.json`

### 2. Release Workflow File

- **Path**: `.github/workflows/release.yml`
- **Purpose**: Automated production build and draft GitHub Release on semver tags
- **Trigger event**: `push` tags matching `v[0-9]+.[0-9]+.[0-9]+`
- **Jobs**: quality checks (parallel) → release (sequential, depends on checks passing)
- **Outputs**: Draft GitHub Release with `figma-event-modeling-plugin-v{version}.zip` artifact
- **Permissions**: `contents: write`

### 3. Package.json Changes

- **Path**: `package.json`
- **Changes**: Add `oxlint` devDependency, add `lint` script
- **New script**: `"lint": "oxlint"`

### 4. Release Documentation

- **Path**: `docs/releasing.md`
- **Purpose**: Step-by-step guide for the release process
- **Audience**: Contributors and maintainers

## State Transitions

### Release Lifecycle

```
Tag pushed (v*.*.*)
  → Quality checks run (parallel: test, typecheck, lint, build)
  → All pass → Production build
  → Zip dist/ folder
  → Draft GitHub Release created with artifact
  → Maintainer reviews and publishes release
  → Manual submission to Figma marketplace
```

### PR Lifecycle (CI)

```
PR opened/updated
  → 4 parallel checks run (test, typecheck, lint, build)
  → All pass → PR mergeable (if branch protection enabled)
  → Any fail → PR blocked
```
