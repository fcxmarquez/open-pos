---
name: personal-linear
description: Use whenever you need to create, draft, consult, triage, or update Linear issues in any project. Enforce the existing Project, Priority, and Label metadata and use a pragmatic PRD format that scales from small fixes to product features.
---

# Personal Linear issues

Create Linear issues that are clear enough to guide implementation without turning every ticket into a long specification. Capture the user problem, intended outcome, agreed scope, and observable completion criteria. Add detail only when it reduces meaningful ambiguity.

## Required Linear fields

Every issue must have:

- **Project:** Select the existing project that corresponds to the current repository or workstream. Do not create a project.
- **Priority:** Select the priority that reflects urgency and impact.
- **Label:** Select the most relevant existing label. Do not create a label.

If the correct value cannot be determined from the request or current context, inspect the available Linear projects and labels. Ask the user only when a consequential choice remains ambiguous.

## Issue title

Write a concise, specific title that describes the outcome or problem. Prefer language such as `Allow…`, `Prevent…`, `Improve…`, or `Investigate…` over vague titles such as `Update feature` or `Fix issue`.

## Description format

Use the following pragmatic PRD structure. Include every core section. Include optional sections only when they add useful information; do not leave empty headings or placeholder text in the issue.

```markdown
## Problem
Describe the user problem, pain point, or job to be done. Explain why it matters and who is affected. For bugs, briefly state the current behavior and its impact.

## Desired Outcome
Describe the user or business result this issue should produce. Focus on the outcome, not implementation activity.

## Proposed Solution
Describe what should change at a product or behavior level. Keep the solution proportional to the issue and avoid prescribing implementation details unless the user requested a technical specification.

## Scope
### In Scope
- List the behavior and scenarios this issue covers.

### Out of Scope
- List closely related work that is intentionally excluded.

## Acceptance Criteria
- Given [context], when [action], then [observable outcome].
- Use a concise checklist instead when Given/When/Then would be artificial.

## Key Decisions
- Record important product, design, or scope decisions and their rationale.

## Edge Cases
- Describe meaningful boundary conditions, empty states, failures, permissions, or recovery behavior.

## Constraints
- Record fixed product, business, legal, platform, compatibility, or time constraints.

## Dependencies
- List external teams, services, preceding issues, decisions, or assets required to complete the work.

## References
- Add relevant links to designs, research, documentation, related issues, or supporting evidence.
```

The core sections are **Problem**, **Desired Outcome**, **Proposed Solution**, **Scope**, and **Acceptance Criteria**. **Key Decisions**, **Edge Cases**, **Constraints**, **Dependencies**, and **References** are optional.

## Adapt the format to the issue

- **Small fix or maintenance task:** Keep each core section to one or two sentences or bullets. Use `Out of Scope` only when a nearby concern could cause scope creep.
- **Bug:** State current versus expected behavior in `Problem` or `Acceptance Criteria`. Add reproduction evidence to `References` when available.
- **Feature:** Use the full core structure and add optional sections wherever decisions or edge cases would otherwise be lost.
- **Research or spike:** Use `Proposed Solution` to describe the question to investigate and expected deliverable. Acceptance criteria should define the decision, recommendation, or evidence the investigation must produce.
- **Technical specification:** Include implementation notes only when the user explicitly asks for them. Keep product behavior and technical approach clearly separated.

## Writing guidance

1. Use information already available in the conversation, repository, linked issue, or supporting material before asking questions.
2. Ask a focused clarifying question before creating the issue only when missing information would materially change the problem, scope, or acceptance criteria. Otherwise, make a reasonable assumption and state it in the issue.
3. Write acceptance criteria as externally observable behavior. They define when the issue is complete, not the engineering steps used to get there.
4. Keep the description proportional to the work. Prefer concrete statements and short bullets over exhaustive prose.
5. Do not invent requirements, metrics, projects, labels, dependencies, or edge cases. Omit optional sections that have no verified content.
6. Avoid code file paths, database schema details, function names, or architecture prescriptions unless the user requested a technical specification.

Before saving, check that the title is specific, the scope has a clear boundary, the acceptance criteria are testable, and the required Linear fields use existing values.
