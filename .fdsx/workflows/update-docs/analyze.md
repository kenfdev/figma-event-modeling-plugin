You are analyzing the fdsx source code against its current README.md to find discrepancies.

Below is a dump of the current README.md and the fdsx source code.

{collected_data}

## Your Task

Compare the **source code** (the ground truth) against the **current README.md**. Identify ALL discrepancies, including:

1. **New features** in source code not documented in the README
2. **Removed features** documented in the README but no longer in source code
3. **Changed behavior** — CLI commands renamed, flags added/removed, defaults changed
4. **New providers** added but not listed in the README
5. **New CLI commands or flags** not documented
6. **New state types** not mentioned
7. **Incorrect examples** — YAML snippets or CLI commands that no longer match the actual API
8. **Installation changes** — package name, install methods, or dependencies that changed
9. **Misleading descriptions** — overview text that no longer accurately describes the tool

Be thorough and precise. For each discrepancy, cite:
- The source file and relevant code
- The README section that's wrong or missing
- What the correct documentation should say

Structure your output as:

### README.md Discrepancies
(list each discrepancy with source evidence)

### Summary
- Total discrepancies found: N
- Sections needing updates: (list section names)

End your response with exactly one of these keywords:
- CHANGES_NEEDED — if any discrepancies were found
- UP_TO_DATE — if the README accurately reflects the source code
