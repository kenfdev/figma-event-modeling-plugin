---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
argument-hint: [generation context or constraints]
disable-model-invocation: true
handoffs:
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Run with takt
    agent: taktist
    prompt: run
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json [SPECS_DIR]` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. If `$ARGUMENTS` starts with a path to a specs directory (e.g., `specs/20260306120000-...`), pass it as the SPECS_DIR positional argument to the script. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Interview the user about task generation preferences BEFORE generating tasks**:

   After loading the spec and plan context, conduct a focused interview using the **AskUserQuestion** tool to understand how the user wants tasks structured, scoped, and prioritized. Do NOT generate tasks until you have clear understanding.

   **Interview process**:
   - Ask ONE question at a time via AskUserQuestion
   - Analyze the plan and spec to identify decision points about task breakdown, then probe the user
   - When you believe you have sufficient understanding, ask: "I think I understand how you want the tasks structured. Do you have any other preferences or constraints before I generate them?"
   - Continue if the user raises new points
   - Stop only when you have clear understanding AND the user confirms nothing more to add

   **What to ask about** (adapt based on the feature — skip irrelevant areas):
   - Task granularity: Should tasks be fine-grained (one file per task) or coarser (one feature slice per task)?
   - Testing strategy: Should test tasks be included? TDD style (tests first) or tests alongside implementation?
   - MVP scope: Which user stories constitute the minimum viable increment? Should later stories be deferred?
   - Parallel execution: Are multiple developers working on this? Should tasks be optimized for parallelism?
   - Priority overrides: Does the user want to reorder any user stories from what the spec suggests?
   - Implementation preferences: Any specific patterns, approaches, or constraints for task execution?
   - Dependencies: Are there external blockers or prerequisites the user knows about?
   - Task format: Any preferences on how detailed task descriptions should be?
   - Phasing: Should all phases be generated, or only up to a certain point?
   - Any tasks the user explicitly wants included or excluded?

   **Key rules**:
   - Do NOT generate tasks during the interview
   - Use the plan and spec content to ask targeted questions (e.g., "The plan has 5 user stories — do you want tasks for all of them or just the P1/P2 stories for now?")
   - If the user provided context in $ARGUMENTS, acknowledge it and ask deeper follow-ups

3. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), contracts/ (interface contracts), research.md (decisions), quickstart.md (test scenarios)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

4. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map interface contracts to user stories
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by user story (see Task Generation Rules below)
   - Generate dependency graph showing user story completion order
   - Create parallel execution examples per user story
   - Validate task completeness (each user story has all needed tasks, independently testable)

5. **Generate tasks.md**: Use `.specify/templates/tasks-template.md` as structure, fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks (project initialization)
   - Phase 2: Foundational tasks (blocking prerequisites for all user stories)
   - Phase 3+: One phase per user story (in priority order from spec.md)
   - Each phase includes: story goal, independent test criteria, tests (if requested), implementation tasks
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing story completion order
   - Parallel execution examples per story
   - Implementation strategy section (MVP first, incremental delivery)

6. **Report**: Output path to generated tasks.md and summary:
   - Total task count (fine-grained from tasks.md)
   - Task count per user story
   - Parallel opportunities identified
   - Independent test criteria for each story
   - Suggested MVP scope (typically just User Story 1)
   - Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, labels, file paths)
   - Suggested takt usage: For each phase, show the `takt run <piece> "phase description"` command the user would run

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature specification or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED for user story phase tasks only
   - Format: [US1], [US2], [US3], etc. (maps to user stories from spec.md)
   - Setup phase: NO story label
   - Foundational phase: NO story label  
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

### Task Organization

1. **From User Stories (spec.md)** - PRIMARY ORGANIZATION:
   - Each user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Interfaces/UI needed for that story
     - If tests requested: Tests specific to that story
   - Mark story dependencies (most stories should be independent)

2. **From Contracts**:
   - Map each interface contract → to the user story it serves
   - If tests requested: Each interface contract → contract test task [P] before implementation in that story's phase

3. **From Data Model**:
   - Map each entity to the user story(ies) that need it
   - If entity serves multiple stories: Put in earliest story or Setup phase
   - Relationships → service layer tasks in appropriate story phase

4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → within that story's phase

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns
