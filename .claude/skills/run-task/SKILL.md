---
name: run-task
description: Non-interactive workflow for implementing and reviewing claimed tasks. Use when user says "run-task", "/run-task", or wants to run the next implementation/review cycle. Designed to be executed in a shell loop until complete. Handles non-code tasks automatically. Requires tests to be prepared first via /prepare-task for code tasks.
---

# Run Task Skill

A non-interactive state-machine workflow for implementing and reviewing tasks. Designed to run in a shell loop. For code tasks, requires tests to be prepared first via `/prepare-task`. For non-code tasks, auto-claims and executes them directly.

## Workflow

**Each invocation handles exactly ONE mode. Never combine modes in a single invocation.**

```
/run-task (invocation)
    │
    ▼
Check TaskList for markers in any in_progress task:
    │
    ├─ "###TESTS READY###" found → IMPLEMENT MODE → mark ###NEEDS REVIEW### → END RESPONSE
    │
    ├─ "###NEEDS REVIEW###" found → REVIEW MODE → complete or send back → END RESPONSE
    │
    ├─ in_progress without marker → ERROR: Run /prepare-task first → <promise>COMPLETE</promise>
    │
    └─ No in_progress task → Find next pending task
          │
          ├─ Pending non-code task found → NO-CODE MODE → claim, execute, commit, complete → <promise>COMPLETE</promise>
          │
          ├─ Pending code task found → ERROR: Run /prepare-task first → <promise>COMPLETE</promise>
          │
          ├─ All pending tasks blocked → <promise>COMPLETE</promise>
          │
          └─ No pending tasks → <promise>COMPLETE</promise>
```

---

## No-Code Mode

Triggered when no in_progress task exists, but a pending unblocked task is found that is a **non-code task**.

A task is a **no-code task** if it does NOT involve writing or modifying application/test source code. Examples:
- Updating documentation status (e.g., "Mark X as Done in README")
- Updating markdown files, changelogs, or config files
- Deleting or renaming files without code changes

### Steps

1. **Claim the task**: Mark it as `in_progress`
   ```
   TaskUpdate:
     taskId: <id>
     status: "in_progress"
   ```

2. **Execute the task** directly (e.g., edit markdown files, update status columns, delete files)

3. **Commit the changes** with format: `docs: <description> (#<task-id>)`

4. **Complete the task**:
   ```
   TaskUpdate:
     taskId: <id>
     status: "completed"
   ```

5. Output: "No-code task `<id>` completed. <promise>COMPLETE</promise>"

---

## Implement Mode

Triggered when a task has `###TESTS READY###` marker.

### 1. Get task details

Use `TaskGet` with the task ID. Extract the task subject (without the `###TESTS READY###` prefix), description, and any metadata (e.g., `sliceId`).

### 2. Delegate to figma-plugin-implementer agent

Use the `Task` tool with `subagent_type: "figma-plugin-implementer"` to delegate the actual implementation. The agent has access to all tools and will read tests, implement code, run tests, and commit.

Provide a prompt that includes:
- The task ID
- The task subject and full description
- The feature name (derived from the task)
- Any test file paths mentioned in the description
- Instruction to commit with format: `<type>: <description> (#<task-id>)`

Example:
```
Task:
  subagent_type: "figma-plugin-implementer"
  description: "Implement <feature-name>"
  prompt: "Implement the following task.

    Task ID: <id>
    Subject: <subject without marker>
    Description: <full task description>

    Write implementation code to make the approved tests pass.
    Commit with format: <type>: <description> (#<id>)"
```

### 3. Mark for review and STOP

After the implementer agent finishes, update ONLY the subject. **Do NOT change the status — it MUST remain `in_progress`.**

```
TaskUpdate:
  taskId: <id>
  subject: "###NEEDS REVIEW### <subject without ###TESTS READY###>"
  (DO NOT set status — leave it as in_progress)
```

Output: "Implementation complete. Run `/run-task` again to review."

**CRITICAL: You MUST end your response here. Do NOT proceed to Review Mode in the same invocation. The review happens in a SEPARATE `/run-task` invocation. If you continue past this point into review, you are violating the workflow.**

**CRITICAL: Do NOT set `status: "completed"` here. The task must stay `in_progress` so the next `/run-task` invocation can find it and enter Review Mode. Setting it to `completed` will break the workflow.**

---

## Review Mode

Triggered when a task has `###NEEDS REVIEW###` marker.

### 1. Get task details

Use `TaskGet` with the task ID.

### 2. Detect changed files

```bash
git diff --name-only HEAD~1
```

### 3. Run tests

Auto-detect test runner:
- Check `package.json` for scripts.test → `npm test` / `pnpm test` / `yarn test`
- Check for `Makefile` with test target → `make test`
- Check for `pytest.ini`, `setup.py`, `pyproject.toml` → `pytest`
- Check for `Cargo.toml` → `cargo test`
- Check for `go.mod` → `go test ./...`

If tests fail, proceed to "Implementation needs work" with failures as feedback.

### 4. Run code review

Use Task tool with `subagent_type: "figma-plugin-reviewer"` to delegate the review to the specialized reviewer agent:

```
Task:
  subagent_type: "figma-plugin-reviewer"
  description: "Review code changes"
  prompt: "Review the code changes for task '<task subject>'.

    Changed files: <list from git diff>
    Task requirements: <task description>

    After your review, state your overall assessment clearly as either PASS or NEEDS_WORK."
```

### 5. Decision

**If tests pass AND review returns PASS:**

1. Update task:
   ```
   TaskUpdate:
     taskId: <id>
     subject: "<original subject without ###NEEDS REVIEW### prefix>"
     status: "completed"
   ```

2. **Update slice status in README** (if applicable):
   1. Use `TaskGet` to check if the completed task has `sliceId` in its metadata
   2. If yes, use `TaskList` to find all tasks with the same `sliceId` metadata
   3. If ALL tasks for that slice are now `completed`, update `docs/slices/README.md`:
      - Find the row matching the slice ID and set the Status column to `Done`
   4. If some tasks remain incomplete, skip this step

3. Output: "Task `<id>` reviewed and closed. <promise>COMPLETE</promise>"

**If tests fail OR review returns NEEDS_WORK:**

1. Change marker back to ready (for re-implementation):
   ```
   TaskUpdate:
     taskId: <id>
     subject: "###TESTS READY### <subject without ###NEEDS REVIEW###>"
   ```

2. Add feedback to description:
   ```
   TaskUpdate:
     taskId: <id>
     description: "<original description>

   ## Review Feedback

   ### Test Results
   <failures or 'All tests passed'>

   ### Code Review
   <issues or 'PASS'>

   ## Required Fixes
   - [ ] Issue 1
   - [ ] Issue 2
   ..."
   ```

3. **Record lessons learned** to `LESSONS.md` at the project root (see [Lessons Learned](#lessons-learned) section below).

4. Output: "Implementation needs work. Feedback added. Lessons recorded in LESSONS.md. Run `/run-task` again to fix."

**STOP after review mode.**

---

## Error Handling

If an in_progress task exists but has no recognized marker (`###TESTS READY###` or `###NEEDS REVIEW###`):
- Output "Task is in_progress but not ready for run-task. Run `/prepare-task` first. <promise>COMPLETE</promise>"

If no in_progress task is found:

1. Check `TaskList` for any pending unblocked tasks
2. If a pending unblocked **non-code task** exists: Enter **No-Code Mode** (see above)
3. If a pending unblocked **code task** exists: Output "No task is claimed for implementation. Run `/prepare-task` first. <promise>COMPLETE</promise>"
4. If no pending tasks at all: Output "No pending tasks available. <promise>COMPLETE</promise>"
5. If all remaining pending tasks are blocked: Output "All remaining tasks are blocked by incomplete dependencies. <promise>COMPLETE</promise>"

---

## Lessons Learned

When a review returns **NEEDS_WORK** (test failures or code review issues), record what was learned in `LESSONS.md` at the project root. This creates a persistent log of review feedback, discovered patterns, and mistakes to avoid.

### What to record

Distill the review feedback into concise, reusable bullet points covering:
- **Review feedback**: What the reviewer pointed out as issues or improvements needed
- **Patterns discovered**: Coding patterns, architectural decisions, or conventions learned
- **Mistakes to avoid**: Specific mistakes made and how to prevent them in the future

### Format

Append to `LESSONS.md` (create it if it doesn't exist). Each entry is grouped by date with bullet points:

```markdown
# Lessons Learned

## 2025-01-31

- **[Review feedback]** Task "Add login form": Avoid inline styles in React components; use CSS modules consistent with the rest of the codebase
- **[Pattern]** Handler tests should mock `figma.currentPage.selection` before calling the handler, not after
- **[Mistake to avoid]** Don't forget to reset mocks in `beforeEach` — stale state caused false-positive test passes

## 2025-01-30

- **[Review feedback]** Task "Export feature": Always validate user input at the boundary before passing to internal functions
```

### Rules for recording

- Only record lessons when the review provides actionable feedback that leads to code changes (NEEDS_WORK)
- Do NOT record lessons for clean passes (PASS with no issues)
- Keep each bullet point concise (1-2 sentences max)
- Tag each bullet with one of: `[Review feedback]`, `[Pattern]`, `[Mistake to avoid]`
- Group entries under a date heading (`## YYYY-MM-DD`); append to existing date section if one exists for today
- If `LESSONS.md` doesn't exist yet, create it with the `# Lessons Learned` heading

---

## Rules

- **CRITICAL — ONE MODE PER INVOCATION**: Each `/run-task` invocation handles EXACTLY ONE mode (either No-Code, Implement, OR Review, never multiple). After Implement Mode marks the task `###NEEDS REVIEW###`, you MUST end your response. Do NOT continue into Review Mode in the same invocation.
- **CRITICAL**: ALWAYS emit `<promise>COMPLETE</promise>` when you have no more tasks to do (i.e., task reviewed and closed successfully, no-code task completed, or no pending tasks remain). Do NOT emit it at intermediate stop points where more work remains (e.g., after implementation before review, or after review failure).
- NEVER start implementation without `###TESTS READY###` marker
- NEVER change task status in implement mode — it MUST stay `in_progress`. Only set `status: "completed"` in review mode after successful review. Setting completed in implement mode breaks the workflow because the next invocation cannot find the task.
- ALWAYS run tests before commit and before closing
- ALWAYS commit before marking for review
- Markers go at START of subject: `###TESTS READY###`, `###NEEDS REVIEW###`
- After failed review, task goes back to `###TESTS READY###` for re-implementation
- Follow project's existing test conventions
