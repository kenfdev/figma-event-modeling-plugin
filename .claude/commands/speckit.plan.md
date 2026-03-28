---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
argument-hint: [tech stack or planning context]
disable-model-invocation: true
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json [SPECS_DIR]` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. If `$ARGUMENTS` starts with a path to a specs directory (e.g., `specs/20260306120000-...`), pass it as the SPECS_DIR positional argument to the script. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Deep-dive interview the user about technical decisions and architecture BEFORE generating the plan**:

   After loading the spec and context, conduct a thorough interview using the **AskUserQuestion** tool to understand the user's technical preferences, constraints, and concerns. Do NOT start filling out the plan until you have clear understanding.

   **Interview process**:
   - Ask ONE question at a time via AskUserQuestion
   - Analyze the spec to identify every technical decision point, then probe the user on each
   - Questions must be specific and non-obvious — informed by the actual feature requirements
   - Dig deeper when answers reveal complexity or when the user mentions constraints
   - When you believe you have sufficient understanding, ask: "I think I have a clear picture of the technical direction. Do you have any other preferences, constraints, or concerns before I generate the plan?"
   - Continue if the user raises new points
   - Stop only when you have clear understanding AND the user confirms nothing more to add

   **What to ask about** (adapt to the specific feature — skip irrelevant areas):
   - Tech stack preferences and constraints (languages, frameworks, databases, infrastructure)
   - Architecture style preferences (monolith vs microservices, layered vs hexagonal, etc.)
   - Existing codebase patterns that must be followed or intentionally broken
   - Data storage and modeling preferences
   - Integration patterns with existing systems
   - Testing strategy preferences (TDD, integration-first, contract testing, etc.)
   - Deployment and infrastructure constraints
   - Performance and scalability requirements that affect architecture
   - Security architecture concerns (auth strategy, data encryption, etc.)
   - Observability needs (logging, metrics, tracing)
   - Known technical debt or areas to avoid
   - Build/CI pipeline constraints
   - Any libraries or tools the user specifically wants to use or avoid
   - Tradeoffs the user has opinions on (e.g., build vs buy, speed vs correctness)

   **Key rules**:
   - Do NOT start generating plan content during the interview
   - Use the spec content to ask targeted questions (e.g., "The spec mentions real-time updates — are you thinking WebSockets, SSE, or polling?")
   - If the user provided tech stack info in $ARGUMENTS, acknowledge it and ask deeper follow-ups rather than re-asking

4. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

5. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

   **Web research**: When agents need to fetch web content (docs, articles, blog posts), they MUST use the `/defuddle` skill instead of raw WebFetch/WebSearch. This avoids rate limits and produces cleaner markdown output.

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Define interface contracts** (if project has external interfaces) → `/contracts/`:
   - Identify what interfaces the project exposes to users or other systems
   - Document the contract format appropriate for the project type
   - Examples: public APIs for libraries, command schemas for CLI tools, endpoints for web services, grammars for parsers, UI contracts for applications
   - Skip if project is purely internal (build scripts, one-off tools, etc.)

3. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
