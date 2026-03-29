# Releasing

## Prerequisites

- All CI checks pass on `main`
- Decide on the version number (e.g., `v1.0.0`)

## Creating a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

## What Happens Automatically

Two workflows handle the release process:

**`.github/workflows/ci.yml`** — Runs on every push to `main` and all pull requests. Contains 4 parallel jobs:
- `test` — Runs unit tests
- `typecheck` — Type-checks the codebase
- `lint` — Lints the codebase
- `build` — Builds the production bundle

**`.github/workflows/release.yml`** — Runs when a semver tag (`v[0-9]+.[0-9]+.[0-9]+`) is pushed. Contains 3 quality-check jobs (`test`, `typecheck`, `lint`) that run in parallel, then a `release` job that:
1. Runs `npm run release` to build the production bundle
2. Zips the `dist/` folder as `figma-event-modeling-plugin-v{version}.zip`
3. Creates a draft GitHub Release with the zip artifact and auto-generated release notes

## Publishing the Release

1. Go to the GitHub Releases page for the repository
2. Find the draft release
3. Review and edit the release notes if needed
4. Click **Publish**

## Submitting to Figma

1. Download the `figma-event-modeling-plugin-v{version}.zip` from the GitHub Release
2. Extract the zip file
3. Open the Figma desktop app
4. Navigate to Plugins → Development → Submit plugin
5. Upload the extracted contents and follow the submission flow
