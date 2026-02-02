---
name: prepare-task
description: TDD test preparation workflow. Use when user says "prepare-task", "/prepare-task", or wants to prepare the next available task. Claims a pending code task, writes tests, and gets user approval before implementation.
---

# Prepare Task Skill

Claims the next available task and writes tests first (TDD), then gets user approval.

## Workflow

```
/prepare-task
    │
    ▼
Check TaskList for in_progress task with ###TESTS PENDING###:
    │
    ├─ Found → Resume test approval
    │
    └─ Not found → Find pending task and start TDD
```

---

## Main Flow

### 1. Check for existing work

Use `TaskList`. Look for any task with:
- Status: `in_progress`
- Subject contains `###TESTS PENDING###`

If found → Jump to **Step 4** (Resume test approval)

### 2. Find next task

Use `TaskList`. Selection criteria:
1. Status: `pending`
2. NOT blocked (no incomplete `blockedBy` tasks)
3. Pick first matching task

If none available: "No pending tasks available."

### 3. Claim the task

1. `TaskGet` for full details
2. Mark in progress:
   ```
   TaskUpdate:
     taskId: <id>
     status: "in_progress"
   ```

### 4. TDD: Create tests FIRST

This is the critical step. Tests define "done".

1. **Analyze project conventions**: Look at existing tests to understand:
   - Test file locations (e.g., `__tests__/`, `test/`, `*_test.go`)
   - Naming patterns (e.g., `*.test.ts`, `*.spec.js`, `test_*.py`)
   - Testing framework used
   - Test style and patterns

2. **Write essential tests**: Create tests that:
   - Cover the core requirements from task description
   - Define clear acceptance criteria
   - Are minimal but sufficient - no redundant tests
   - Focus on behavior, not implementation details
   - **Use semantic queries for UI tests**: Prefer queries that reflect how users interact with the UI:
     - `getByRole` (buttons, headings, textboxes, etc.)
     - `getByLabelText` (form fields)
     - `getByText` (visible text content)
     - `getByPlaceholderText` (input placeholders)
   - **NEVER use `getByTestId`** - it has no semantic meaning and doesn't test what users actually see/interact with

3. **Mark for test approval**:
   ```
   TaskUpdate:
     taskId: <id>
     subject: "###TESTS PENDING### <current subject>"
   ```

### 5. Ask user to approve tests

**IMPORTANT**: List all test cases explicitly so the user can review without opening the test file.

1. **Summarize what was created**: Before asking for approval, output a clear summary:
   ```
   ## Test Summary for: <task subject>

   **Test file**: `<path/to/test/file>`

   **Test cases**:
   - <test case 1 description - what it verifies>
   - <test case 2 description - what it verifies>
   - <test case 3 description - what it verifies>
   ...
   ```

2. **Ask for approval** using AskUserQuestion:
   ```
   AskUserQuestion:
     questions:
       - question: "Are these test cases appropriate in scope and coverage for this task?"
         header: "Test Review"
         options:
           - label: "Approve tests"
             description: "Tests look good, proceed to implementation"
           - label: "Request changes"
             description: "Tests need modifications (I'll provide feedback)"
         multiSelect: false
   ```

**Example output before asking**:
```
## Test Summary for: Add user authentication

**Test file**: `src/features/auth/auth.test.ts`

**Test cases**:
- should successfully authenticate with valid credentials
- should reject invalid password
- should reject non-existent user
- should handle empty credentials gracefully
- should lock account after 5 failed attempts
```

### 6. Handle response

**If "Approve tests"**:
1. Change marker to ready:
   ```
   TaskUpdate:
     taskId: <id>
     subject: "###TESTS READY### <subject without ###TESTS PENDING###>"
   ```
2. Output: "Tests approved. Task is ready for implementation. Run `/run-task` to implement."

**If "Request changes"**:
1. Keep `###TESTS PENDING###` marker
2. Wait for user feedback
3. Modify tests based on feedback
4. Ask for approval again (repeat Step 4)

**STOP and wait for user response after asking for approval.**

---

## Rules

- ALWAYS write tests FIRST before any implementation
- ALWAYS get user approval on tests before marking ready
- Tests should be essential - quality over quantity
- Markers go at START of subject: `###TESTS PENDING###`, `###TESTS READY###`
- Never select blocked tasks
- Follow project's existing test conventions
- Task stays `in_progress` after tests are approved
