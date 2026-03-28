You are updating the fdsx README.md based on a source code analysis.

## Source Data
{collected_data}

## Analysis of Discrepancies
{analysis}

## Your Task

Generate the complete updated README.md content and **print it to stdout as plain text**. Do NOT use any tools (Read, Edit, Write, Bash) to modify files. Your entire text output will be captured and saved automatically by the workflow engine.

**Rules:**
1. Preserve the existing structure and writing style of README.md
2. Keep the document concise — README should be an overview, not exhaustive documentation
3. Only change sections where discrepancies were found — don't rewrite sections that are already correct
4. Ensure all CLI commands and flags match `cli/main.py` exactly
5. Ensure all YAML examples use correct field names and valid syntax
6. Ensure the provider list matches the actual providers in `providers/`
7. Ensure state types listed match what the source code supports
8. Keep examples minimal and representative — don't add every possible option
9. If new features were added, mention them briefly in the appropriate section
10. If features were removed, remove them cleanly without leaving stubs
11. Preserve badges, license section, and any links that are still valid

**IMPORTANT: Output ONLY the raw file content. No preamble, no explanation, no code fences. Just the complete README.md content starting with `# fdsx`.**
