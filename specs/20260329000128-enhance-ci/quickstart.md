# Quickstart: Enhance CI/CD Pipeline

## Prerequisites

- Node.js 22 LTS installed locally
- Repository hosted on GitHub with Actions enabled

## Implementation Order

### Step 1: Add oxlint dependency and lint script

```bash
npm install -D oxlint
```

Add to `package.json` scripts:
```json
"lint": "oxlint"
```

Verify locally:
```bash
npm run lint
```

### Step 2: Create CI workflow

Create `.github/workflows/ci.yml` from the contract at `contracts/ci-workflow.yml`.

Verify by pushing a branch and opening a PR — all 4 jobs should appear as separate checks.

### Step 3: Create release workflow

Create `.github/workflows/release.yml` from the contract at `contracts/release-workflow.yml`.

Verify by pushing a test tag:
```bash
git tag v0.0.1-test
git push origin v0.0.1-test
```

Check that a draft release is created with the zip artifact, then delete the test tag/release.

### Step 4: Write release documentation

Create `docs/releasing.md` covering:
1. How to prepare a release (version decisions, what to check)
2. How to create and push a semver tag
3. What CI does automatically
4. Manual Figma submission steps

### Step 5: Verify end-to-end

- [ ] Open a PR → 4 parallel CI checks run and report status
- [ ] Merge to main → same checks run on push
- [ ] Push a semver tag → quality checks pass, then release job builds + creates draft release
- [ ] Draft release has correct zip artifact name
- [ ] `docs/releasing.md` is accurate and complete
