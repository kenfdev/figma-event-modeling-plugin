---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
argument-hint: [principles or updates]
disable-model-invocation: true
handoffs:
  - label: Build Specification
    agent: speckit.specify
    prompt: Implement the feature specification based on the updated constitution. I want to build...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

You are updating the project constitution at `.specify/memory/constitution.md`. This file is a TEMPLATE containing placeholder tokens in square brackets (e.g. `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job is to (a) collect/derive concrete values, (b) fill the template precisely, and (c) propagate any amendments across dependent artifacts.

**Note**: If `.specify/memory/constitution.md` does not exist yet, it should have been initialized from `.specify/templates/constitution-template.md` during project setup. If it's missing, copy the template first.

Follow this execution flow:

1. **Deep-dive interview the user about project principles and governance BEFORE making changes**:

   Before touching the constitution, conduct a thorough interview using the **AskUserQuestion** tool to understand the user's values, principles, and governance expectations. Do NOT modify the constitution until you have clear understanding.

   **Interview process**:
   - Ask ONE question at a time via AskUserQuestion
   - If the user provided principles in $ARGUMENTS, use them as a starting point and ask deeper follow-ups
   - If no principles were provided, interview from scratch about the project's core values
   - When you believe you have sufficient understanding, ask: "I think I have a clear picture of your project principles and governance needs. Do you have any other values, constraints, or preferences to add?"
   - Continue if the user raises new points
   - Stop only when you have clear understanding AND the user confirms nothing more to add

   **What to ask about** (adapt to the project — skip irrelevant areas):
   - What are the non-negotiable principles for this project? What must NEVER be compromised?
   - What quality attributes matter most? (e.g., correctness > performance > developer experience)
   - Testing philosophy: What level of test coverage and what testing strategies are required?
   - Code style and architecture principles: Any strong opinions on patterns, conventions?
   - Security posture: How strict should security requirements be?
   - Observability and operational excellence: What's required for production readiness?
   - Documentation standards: What level of documentation is expected?
   - Dependency management: Philosophy on third-party dependencies?
   - Governance: Who can amend the constitution? What process should changes follow?
   - Versioning: How should the project handle breaking changes?
   - Are there anti-patterns or past mistakes the user wants to explicitly prohibit?
   - Any compliance, regulatory, or organizational constraints?

   **Key rules**:
   - Do NOT start editing the constitution during the interview
   - If updating an existing constitution, ask about what specifically needs to change and why
   - Probe for the reasoning behind principles — this helps write better rationale sections

2. Load the existing constitution at `.specify/memory/constitution.md`.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
   **IMPORTANT**: The user might require less or more principles than the ones used in the template. If a number is specified, respect that - follow the general template. You will update the doc accordingly.

3. Collect/derive values for placeholders:
   - If user input (conversation or interview answers) supplies a value, use it.
   - Otherwise infer from existing repo context (README, docs, prior constitution versions if embedded).
   - For governance dates: `RATIFICATION_DATE` is the original adoption date (if unknown, use the **AskUserQuestion** tool to ask the user, or mark TODO if they don't know), `LAST_AMENDED_DATE` is today if changes are made, otherwise keep previous.
   - `CONSTITUTION_VERSION` must increment according to semantic versioning rules:
     - MAJOR: Backward incompatible governance/principle removals or redefinitions.
     - MINOR: New principle/section added or materially expanded guidance.
     - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
   - If version bump type ambiguous, propose reasoning before finalizing.

4. Draft the updated constitution content:
   - Replace every placeholder with concrete text (no bracketed tokens left except intentionally retained template slots that the project has chosen not to define yet—explicitly justify any left).
   - Preserve heading hierarchy and comments can be removed once replaced unless they still add clarifying guidance.
   - Ensure each Principle section: succinct name line, paragraph (or bullet list) capturing non‑negotiable rules, explicit rationale if not obvious.
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review expectations.

5. Consistency propagation checklist (convert prior checklist into active validations):
   - Read `.specify/templates/plan-template.md` and ensure any "Constitution Check" or rules align with updated principles.
   - Read `.specify/templates/spec-template.md` for scope/requirements alignment—update if constitution adds/removes mandatory sections or constraints.
   - Read `.specify/templates/tasks-template.md` and ensure task categorization reflects new or removed principle-driven task types (e.g., observability, versioning, testing discipline).
   - Read each command file in `.specify/templates/commands/*.md` (including this one) to verify no outdated references (agent-specific names like CLAUDE only) remain when generic guidance is required.
   - Read any runtime guidance docs (e.g., `README.md`, `docs/quickstart.md`, or agent-specific guidance files if present). Update references to principles changed.

6. Produce a Sync Impact Report (prepend as an HTML comment at top of the constitution file after update):
   - Version change: old → new
   - List of modified principles (old title → new title if renamed)
   - Added sections
   - Removed sections
   - Templates requiring updates (✅ updated / ⚠ pending) with file paths
   - Follow-up TODOs if any placeholders intentionally deferred.

7. Validation before final output:
   - No remaining unexplained bracket tokens.
   - Version line matches report.
   - Dates ISO format YYYY-MM-DD.
   - Principles are declarative, testable, and free of vague language ("should" → replace with MUST/SHOULD rationale where appropriate).

8. Write the completed constitution back to `.specify/memory/constitution.md` (overwrite).

9. Output a final summary to the user with:
   - New version and bump rationale.
   - Any files flagged for manual follow-up.
   - Suggested commit message (e.g., `docs: amend constitution to vX.Y.Z (principle additions + governance update)`).

Formatting & Style Requirements:

- Use Markdown headings exactly as in the template (do not demote/promote levels).
- Wrap long rationale lines to keep readability (<100 chars ideally) but do not hard enforce with awkward breaks.
- Keep a single blank line between sections.
- Avoid trailing whitespace.

If the user supplies partial updates (e.g., only one principle revision), still perform validation and version decision steps.

If critical info missing (e.g., ratification date truly unknown), insert `TODO(<FIELD_NAME>): explanation` and include in the Sync Impact Report under deferred items.

Do not create a new template; always operate on the existing `.specify/memory/constitution.md` file.
