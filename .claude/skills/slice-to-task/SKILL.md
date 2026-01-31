---
name: slice-to-task
description: |
  Convert feature slice documents into Claude Code tasks. Reads slice markdown files (containing Type, Description, User Story, Acceptance Criteria, Dependencies, Technical Notes) and creates appropriately-sized tasks using TaskCreate. Use when user says "slice-to-task", "/slice-to-task", wants to convert a slice to tasks, or wants to implement a feature slice. Checks slice dependencies and warns if prerequisites are incomplete.
---

# Slice to Task

Convert feature slice documents into Claude Code tasks for implementation.

## Slice Document Format

Slice files follow this structure:

```markdown
# F<phase>.<number>: <FeatureName>

## Type
Command | Query | Infrastructure

## Description
Brief description of what this feature does.

## User Story
As a user, I want to...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
...

## Dependencies
- F<x>.<y>: DependencyName
...

## Technical Notes
Implementation details...
```

## Workflow

1. **Read the slice file** provided by the user
2. **Check dependencies** - Look for existing tasks or completed work for listed dependencies. Warn if prerequisites appear incomplete.
3. **Analyze complexity** to determine task sizing:
   - **Simple slice** (≤3 acceptance criteria, straightforward): Create 1 task
   - **Medium slice** (4-6 criteria, some complexity): Create 2-3 tasks grouped by concern
   - **Complex slice** (7+ criteria or high complexity): Create 3-5 tasks split logically
4. **Create tasks** using TaskCreate with:
   - Clear subject in imperative form (e.g., "Implement CreateGWT command")
   - Description including relevant acceptance criteria and technical notes
   - activeForm in present continuous (e.g., "Implementing CreateGWT command")
   - metadata with `sliceId` set to the slice ID (e.g., `metadata: { sliceId: "F5.2" }`)
5. **Create a final "Update README status" task** for the slice:
   - Subject: "Mark F<id> as Done in docs/slices/README.md"
   - Description: "Update the Status column for F<id> in `docs/slices/README.md` to `Done`. This task should only be completed after all other tasks for this slice pass review."
   - activeForm: "Updating slice status in README"
   - metadata with `sliceId` set to the same slice ID
   - Use `addBlockedBy` to make this task depend on all other tasks created for the slice

## Task Sizing Guidelines

Group acceptance criteria by logical concern:

| Concern | Example Criteria |
|---------|------------------|
| Core functionality | "Clicking button creates element", "Element appears at viewport center" |
| Data/Storage | "Element stores type in plugin data", "Data persists" |
| Visual/UI | "Element properties: color, size, shape", "UI updates in real-time" |
| Validation/Edge cases | "Multiple clicks create multiple elements", "Empty values allowed" |

For slices with nested structures (like GWT with sub-sections), consider splitting:
- Task 1: Create parent structure
- Task 2: Create and arrange child structures
- Task 3: Wire up interactions/data

## Dependency Checking

Before creating tasks:

1. Parse the `## Dependencies` section from the slice
2. Use TaskList to check if related tasks exist and their status
3. If dependencies appear incomplete, warn the user:
   ```
   Warning: This slice depends on:
   - F0.1: OpenPluginPanel (not found in tasks)
   - F0.2: DetectPlatform (not found in tasks)

   Consider implementing dependencies first, or proceed if they're already complete.
   ```
4. Ask user whether to proceed or implement dependencies first

## Example

Given slice F5.2-create-gwt with 6 acceptance criteria:

**Analysis:**
- Creates parent section + 3 nested sections = structural complexity
- Has positioning logic for sub-sections
- Involves plugin data storage

**Task breakdown:**
1. "Create GWT parent section at viewport center" - Core creation + placement + plugin data (metadata: { sliceId: "F5.2" })
2. "Create Given/When/Then nested sections inside GWT" - Child sections + vertical arrangement (metadata: { sliceId: "F5.2" })
3. "Verify GWT structure and user interactions" - Validation that users can place content inside (metadata: { sliceId: "F5.2" })
4. "Mark F5.2 as Done in docs/slices/README.md" - blockedBy: [1, 2, 3] (metadata: { sliceId: "F5.2" })

## Output

After creating tasks, summarize:
```
Created X tasks for slice F<id>:
1. [Task ID] Subject
2. [Task ID] Subject
...
X. [Task ID] Mark F<id> as Done in docs/slices/README.md (blocked by all above)

Run `TaskList` to see all tasks.
```
