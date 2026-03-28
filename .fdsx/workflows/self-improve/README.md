# Self-Improve Workflow

Analyzes codebase quality and recent workflow review feedback to identify improvements and write lessons learned to `.fdsx/LESSONS.md`.

## What It Analyzes

### Codebase Quality (always runs)
- **Linting** — ruff rule gaps, missing rule sets, formatter configuration
- **Type checking** — mypy strictness, untyped code detection
- **Pre-commit hooks** — missing safety hooks, formatting enforcement
- **Agent instructions** — gaps in AGENTS.md/CLAUDE.md guidance
- **CI pipeline** — missing coverage, security scanning, dependency auditing
- **Developer experience** — task runners, typed package markers

### Review Feedback (runs when new workflow runs exist)
- **Rejection patterns** — what causes reviewers to REJECT
- **Preventable mistakes** — issues that linting, hooks, or better rules could catch
- **Recurring themes** — systemic gaps across multiple runs

## Prerequisites

- fdsx installed
- Provider CLI available (configured provider for the `generalist` profile)

## Setup

1. Copy this directory to your workflows folder:

   ```bash
   cp -r examples/self-improve .fdsx/workflows/
   ```

2. Ensure your `.fdsx/config.yaml` has a `generalist` profile. Example:

   ```yaml
   profiles:
     generalist:
       provider: claude
       model: claude-sonnet-4-6
   ```

## Usage

From your project root:

```bash
fdsx run .fdsx/workflows/self-improve/workflow.yaml
```

## Files

| File | Description |
|------|-------------|
| `workflow.yaml` | Workflow definition (7 states) |
| `collect_data.sh` | Gathers reviewer feedback from `.fdsx/runs/` |
| `analyze.md` | Prompt for codebase quality assessment + review feedback analysis |
| `research.md` | Prompt for researching solutions to identified problems |
| `write_lessons.md` | Prompt for composing lessons and updating LESSONS.md |

## How It Works

1. **collect_data** — Extracts reviewer decisions, findings, and fix cycle data from runs since last analysis
2. **analyze** — Reads project config files for codebase quality gaps; analyzes review feedback for patterns
3. **analyze_route** — Routes to research if problems found, otherwise ends cleanly
4. **research** — Finds solutions for each problem (official docs, best practices)
5. **write_lessons** — Composes and merges lessons into `.fdsx/LESSONS.md` (with deduplication)
6. **update_timestamp** / **update_timestamp_clean** — Updates last-run marker

## Output

Lessons are written to `.fdsx/LESSONS.md`, organized by source (Codebase Quality or workflow name) and category (Linting, Hooks, AgentRules, Prompts, Workflow, Rules).
