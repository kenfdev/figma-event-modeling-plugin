# Feature Specification: Enhance CI/CD Pipeline

**Status**: Draft
**Created**: 2026-03-29
**Last Updated**: 2026-03-29

## Overview

Add continuous integration workflows to ensure code quality on every pull request and the main branch, and automate the Figma plugin release process as much as possible. Provide clear documentation so any contributor can understand and execute a release.

## Problem Statement

The project currently has no CI pipeline. Code quality checks (tests, type checking, linting, build verification) are only run locally, meaning broken code can be merged undetected. The release process is entirely manual and undocumented, making it error-prone and opaque to contributors.

## User Scenarios & Testing

### Scenario 1: Developer Opens a Pull Request

**As a** contributor,
**I want** automated quality checks to run on my PR,
**So that** I get fast feedback on whether my changes are safe to merge.

**Acceptance Criteria:**
- When a PR is opened or updated against any branch, CI runs automatically
- Tests (vitest), type checking (tsc), linting (oxlint), and build verification (plugma build) all execute
- Each check reports pass/fail status on the PR
- The PR cannot be merged if any check fails (branch protection recommendation)

### Scenario 2: Code is Merged to Main

**As a** project maintainer,
**I want** the same quality checks to run on every push to main,
**So that** the main branch always reflects a known-good state.

**Acceptance Criteria:**
- When code is pushed to main (including merged PRs), CI runs the same checks as PRs
- Failures on main are immediately visible in the repository's Actions tab

### Scenario 3: Maintainer Creates a Release

**As a** project maintainer,
**I want** to trigger a release by pushing a semver git tag,
**So that** a production-ready bundle is automatically built and made available for download.

**Acceptance Criteria:**
- Pushing a tag matching `v*.*.*` (e.g., `v1.0.0`) triggers the release workflow
- The release workflow builds a production bundle using the production build command
- The built artifact is uploaded to a GitHub Release associated with the tag
- The GitHub Release is created automatically with the artifact attached

### Scenario 4: Contributor Wants to Understand the Release Process

**As a** contributor or maintainer,
**I want** a concise release guide,
**So that** I can execute or understand the end-to-end release process without tribal knowledge.

**Acceptance Criteria:**
- A release guide exists at `docs/releasing.md`
- The guide covers: how to create a release tag, what CI does automatically, and the manual steps for submitting to Figma
- The guide is concise and step-by-step

## Clarifications

### Session 2026-03-29

- Q: Should CI quality checks run as parallel independent jobs or sequential steps in a single job? → A: Single job with sequential steps (simpler workflow, lower Actions minutes usage)
- Q: Which Node.js version should CI use? → A: Node 22 LTS (22.x)
- Q: What should the release artifact contain and how should it be named? → A: Zip of dist/ folder, named `figma-event-modeling-plugin-v{version}.zip`
- Q: Should the GitHub Release be published immediately or created as a draft? → A: Draft (maintainer reviews before publishing)

## Functional Requirements

### FR-1: PR Quality Gate Workflow

A CI workflow runs on every pull request targeting any branch. It executes the following checks as sequential steps in a single job:

1. **Test suite**: Run the full test suite in single-run mode
2. **Type checking**: Run the TypeScript compiler in type-check-only mode
3. **Linting**: Run oxlint to enforce code style and catch common issues
4. **Build verification**: Run the standard build to ensure the plugin compiles without errors

Each check must report its own pass/fail status. If any check fails, the overall workflow fails.

### FR-2: Main Branch Quality Workflow

The same quality checks from FR-1 run on every push to the `main` branch. The workflow configuration may be shared or duplicated, but the checks must be identical.

### FR-3: Release Workflow

A separate CI workflow is triggered when a Git tag matching the pattern `v*.*.*` is pushed. This workflow:

1. Builds the production bundle
2. Zips the `dist/` output as `figma-event-modeling-plugin-v{version}.zip`
3. Creates a **draft** GitHub Release for the tag (maintainer publishes after review)
4. Uploads the zip as a release artifact

### FR-4: Release Documentation

A release guide is created at `docs/releasing.md` that documents:

1. How to prepare a release (version bumping, changelog considerations)
2. How to create and push a semver tag to trigger the release workflow
3. What the CI release workflow does automatically
4. The manual steps required to submit the built artifact to Figma's plugin review process

## Scope

### In Scope

- GitHub Actions workflows for PR and main branch quality checks
- GitHub Actions workflow for automated release builds on semver tags
- GitHub Release creation with artifact upload
- Release process documentation at `docs/releasing.md`
- Adding oxlint as a development dependency

### Out of Scope

- Automated submission to Figma's plugin marketplace (requires manual desktop app interaction)
- Code coverage thresholds or coverage reporting
- Deployment preview builds
- Changelog auto-generation from commits
- Branch protection rule configuration (recommended but configured manually by maintainers)
- Performance benchmarking in CI

## Dependencies

- **GitHub Actions**: The repository must be hosted on GitHub with Actions enabled
- **oxlint**: Must be added as a project dependency for the linting step
- **Node.js**: CI runners use Node.js 22 LTS (22.x)
- **Plugma**: The existing build toolchain used for building and releasing the plugin

## Assumptions

- The repository is hosted on GitHub and GitHub Actions is available
- The project uses npm as its package manager (based on `package-lock.json` presence)
- Contributors have permission to push tags for releases (or a maintainer handles this)
- The Figma plugin submission step will remain manual for the foreseeable future, as Figma does not provide a public API for plugin publishing
- oxlint can be run without an extensive configuration file for initial setup; configuration can be refined over time

## Success Criteria

1. Every pull request receives automated pass/fail feedback on tests, types, linting, and build within 5 minutes of being opened or updated
2. No code with failing tests, type errors, lint violations, or build failures can reach the main branch (when branch protection is enabled)
3. A maintainer can produce a release artifact by pushing a single git tag, with no additional manual CI steps
4. A new contributor can understand and execute the full release process by reading `docs/releasing.md` alone, without asking another team member
5. The CI setup introduces no new runtime dependencies to the plugin itself (all CI-related additions are development-only)
