---
name: spec-interview
description: Interview the user to flesh out feature ideas from the backlog into concrete SPEC.md files
disable-model-invocation: true
---

# Spec Interview

You are interviewing the user to turn rough feature ideas from the Feature Backlog into detailed, concrete specifications.

## Setup

1. Read `docs/spec.md` to understand the project, existing features, and the Feature Backlog section.
2. Read any existing `src/features/*/SPEC.md` files that are relevant to the backlog items.
3. Present the current backlog items to the user and confirm which ones to work on in this session.

## Interview

Work through the backlog items. For each idea, interview the user in depth using the AskUserQuestion tool. Cover all of these areas, but skip questions where the answer is obvious from context:

- **Problem & motivation**: What user pain does this solve? When does this come up?
- **Scope boundaries**: What is explicitly in vs. out of scope?
- **UI & UX**: Where does it appear? What does the user see and interact with? What are the states (empty, loading, error, success)?
- **Data model**: What data is stored, where, and in what format? How does it relate to existing plugin data?
- **Edge cases**: What happens with empty input, invalid input, conflicts with existing features?
- **Technical tradeoffs**: Are there multiple implementation approaches? What are the pros/cons?
- **Dependencies**: Which existing features does this depend on or affect?
- **Acceptance criteria**: What concrete checks determine "done"?

Ask follow-up questions when answers are vague. Challenge assumptions. Suggest alternatives when appropriate. Do not ask questions whose answers are already clear from the codebase or existing specs.

Multiple backlog items may consolidate into a single feature or split into multiple features — let the interview determine the right boundaries.

Continue interviewing until all areas are sufficiently covered for each feature.

## Output

Once the interview is complete:

1. Create `src/features/<feature-name>/SPEC.md` for each finalized feature, following the format used by existing SPEC.md files in the project.
2. Add rows to the Feature Index table in `docs/spec.md` for each new feature (Status column left empty).
3. Remove the corresponding bullet points from the Feature Backlog section in `docs/spec.md`.
