---
description: Create or update the feature specification from a natural language feature description.
argument-hint: <feature description>
disable-model-invocation: true
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/speckit.specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

1. **Deep-dive interview the user BEFORE writing anything**:

   Before generating any spec content, conduct a thorough interview using the **AskUserQuestion** tool. The goal is to deeply understand the user's intent, constraints, concerns, and vision. Do NOT write the spec until you have a clear, complete understanding.

   **Interview process**:
   - Ask ONE question at a time via AskUserQuestion
   - Cover all dimensions: functional scope, user types, edge cases, tradeoffs, constraints, success metrics, UX expectations, security concerns, integration points, and anything else that's relevant
   - Questions must be non-obvious and specific to the feature — never ask generic or boilerplate questions
   - Dig deeper on answers that reveal complexity or ambiguity — follow up aggressively
   - After each answer, assess whether your understanding is complete enough to write a high-quality spec
   - When you believe you have sufficient understanding, ask the user: "I think I have a clear picture now. Do you have any other concerns, constraints, or details you'd like to add before I write the spec?"
   - Continue asking if the user raises new points
   - Stop only when:
     - You have clear understanding of all critical dimensions, AND
     - The user confirms they have nothing more to add (or says "done", "proceed", "go ahead", etc.)

   **What to ask about** (adapt to the specific feature — skip irrelevant areas, go deep on relevant ones):
   - Who are the users/actors? What are their goals and pain points?
   - What's in scope vs explicitly out of scope?
   - What are the most important success criteria from the user's perspective?
   - Are there existing systems, patterns, or constraints this must integrate with?
   - What are the biggest risks or concerns?
   - Are there tradeoffs the user has already considered? (e.g., simplicity vs flexibility, security vs convenience)
   - Edge cases: what happens when things go wrong? Empty states? Concurrent access?
   - Non-functional expectations: performance, scale, availability?
   - UX preferences: how should this feel to the end user?
   - Any hard constraints or non-negotiables?
   - Anything the user has seen elsewhere that they want to emulate or avoid?

   **Key rules**:
   - Do NOT generate the spec during the interview — focus entirely on understanding
   - Do NOT ask questions that have obvious answers from the feature description
   - Prefer specific, probing questions over broad ones (e.g., "Should failed auth attempts lock the account after N tries, or just rate-limit?" not "What about security?")
   - Use the user's answers to generate increasingly targeted follow-up questions

2. **Generate a short name and create the feature directory**:

   a. Analyze the feature description and generate a concise short name (2-4 words, kebab-case):
      - Use action-noun format when possible (e.g., "user-auth", "fix-payment-timeout")
      - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
      - Examples:
        - "I want to add user authentication" → "user-auth"
        - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
        - "Create a dashboard for analytics" → "analytics-dashboard"

   b. Generate a UTC timestamp prefix in `YYYYMMDDHHmmss` format (e.g., `20260306143022`)

   c. Create the feature directory and spec file:
      - Directory: `specs/<YYYYMMDDHHmmss>-<short-name>/` (e.g., `specs/20260306143022-user-auth/`)
      - Spec file: `specs/<YYYYMMDDHHmmss>-<short-name>/spec.md`
      - Checklists directory: `specs/<YYYYMMDDHHmmss>-<short-name>/checklists/`

3. Load `.specify/templates/spec-template.md` to understand required sections.

4. Follow this execution flow:

    1. Parse user description from Input
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description AND interview answers
       Identify: actors, actions, data, constraints
    3. For unclear aspects (most should already be resolved from the interview):
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section
       If no clear user flow: ERROR "Cannot determine user scenarios"
    5. Generate Functional Requirements
       Each requirement must be testable
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Define Success Criteria
       Create measurable, technology-agnostic outcomes
       Include both quantitative metrics (time, performance, volume) and qualitative measures (user satisfaction, task completion)
       Each criterion must be verifiable without implementation details
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

5. Write the specification to the spec file using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) AND interview answers while preserving section order and headings.

6. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

   a. **Create Spec Quality Checklist**: Generate a checklist file at `FEATURE_DIR/checklists/requirements.md` using the checklist template structure with these validation items:

      ```markdown
      # Specification Quality Checklist: [FEATURE NAME]
      
      **Purpose**: Validate specification completeness and quality before proceeding to planning
      **Created**: [DATE]
      **Feature**: [Link to spec.md]
      
      ## Content Quality
      
      - [ ] No implementation details (languages, frameworks, APIs)
      - [ ] Focused on user value and business needs
      - [ ] Written for non-technical stakeholders
      - [ ] All mandatory sections completed
      
      ## Requirement Completeness
      
      - [ ] No [NEEDS CLARIFICATION] markers remain
      - [ ] Requirements are testable and unambiguous
      - [ ] Success criteria are measurable
      - [ ] Success criteria are technology-agnostic (no implementation details)
      - [ ] All acceptance scenarios are defined
      - [ ] Edge cases are identified
      - [ ] Scope is clearly bounded
      - [ ] Dependencies and assumptions identified
      
      ## Feature Readiness
      
      - [ ] All functional requirements have clear acceptance criteria
      - [ ] User scenarios cover primary flows
      - [ ] Feature meets measurable outcomes defined in Success Criteria
      - [ ] No implementation details leak into specification
      
      ## Notes
      
      - Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`
      ```

   b. **Run Validation Check**: Review the spec against each checklist item:
      - For each item, determine if it passes or fails
      - Document specific issues found (quote relevant spec sections)

   c. **Handle Validation Results**:

      - **If all items pass**: Mark checklist complete and proceed to step 5d

      - **If items fail (excluding [NEEDS CLARIFICATION])**:
        1. List the failing items and specific issues
        2. Update the spec to address each issue
        3. Re-run validation until all items pass (max 3 iterations)
        4. If still failing after 3 iterations, document remaining issues in checklist notes and warn user

      - **If [NEEDS CLARIFICATION] markers remain**:
        1. Extract all [NEEDS CLARIFICATION: ...] markers from the spec
        2. For each clarification needed, use the **AskUserQuestion** tool to collect the answer interactively. Keep asking until all markers are resolved. Build the question text in this format:

           ```text
           Question [N]: [Topic]

           Context: [Quote relevant spec section]
           What we need to know: [Specific question from NEEDS CLARIFICATION marker]

           Suggested Answers:
           A) [First suggested answer] — [What this means for the feature]
           B) [Second suggested answer] — [What this means for the feature]
           C) [Third suggested answer] — [What this means for the feature]
           Custom) Provide your own answer — [Explain how to provide custom input]
           ```

           Pass this as the `question` parameter to AskUserQuestion and use the returned answer to resolve the marker.

        3. Number questions sequentially (Q1, Q2, Q3, ...)
        4. Ask each question one at a time via AskUserQuestion (do NOT present all at once)
        5. Update the spec by replacing each [NEEDS CLARIFICATION] marker with the user's selected or provided answer
        6. Continue asking until ALL [NEEDS CLARIFICATION] markers are resolved
        7. Re-run validation after all clarifications are resolved

   d. **Update Checklist**: After each validation iteration, update the checklist file with current pass/fail status

7. Report completion with spec file path, checklist results, and readiness for the next phase (`/speckit.clarify` or `/speckit.plan`).

## General Guidelines

## Quick Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT create any checklists that are embedded in the spec. That will be a separate command.

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Mark clarifications** for decisions that:
   - Significantly impact feature scope or user experience
   - Have multiple reasonable interpretations with different implications
   - Lack any reasonable default
4. **Resolve all clarifications**: Use AskUserQuestion repeatedly until every [NEEDS CLARIFICATION] marker is resolved. Do not limit the number of questions.
5. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
6. **Common areas needing clarification** (only if no reasonable default exists):
   - Feature scope and boundaries (include/exclude specific use cases)
   - User types and permissions (if multiple conflicting interpretations possible)
   - Security/compliance requirements (when legally/financially significant)

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
- Authentication method: Standard session-based or OAuth2 for web apps
- Integration patterns: Use project-appropriate patterns (REST/GraphQL for web services, function calls for libraries, CLI args for tools, etc.)

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective, not system internals
4. **Verifiable**: Can be tested/validated without knowing implementation details

**Good examples**:

- "Users can complete checkout in under 3 minutes"
- "System supports 10,000 concurrent users"
- "95% of searches return results in under 1 second"
- "Task completion rate improves by 40%"

**Bad examples** (implementation-focused):

- "API response time is under 200ms" (too technical, use "Users see results instantly")
- "Database can handle 1000 TPS" (implementation detail, use user-facing metric)
- "React components render efficiently" (framework-specific)
- "Redis cache hit rate above 80%" (technology-specific)
