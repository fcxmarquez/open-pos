---
name: personal-linear
description: Use when you need to create, consult or update a new issue in Linear for the user fcxmarquez.
---

This Linear follows a specific structure for issues. Because it is a solo developer, issues have to contain the Project field which defines the scope of the issue and is correlated with the current repository. Other mandatory fields are Priority and Label. Don't create new projects; use the existing ones. Don't create new labels; use the existing ones.

## Creating an issue

When calling the `save_issue` tool or creating an issue via other means, format the `description` field with the following sections using Markdown:

```markdown
## Problem
Describe the user problem, pain point, or job-to-be-done. Focus on WHY this matters to the user and the business.

## Solution
Outline the proposed product solution. Describe WHAT we are building to solve the problem (without getting into deep technical implementation).

## Key Decisions
List any important product, design, or scope decisions made during planning.

## User Flows
* Given [context], When [action], Then [outcome].
* Given [context], When [action], Then [outcome].

## Edge Cases
* What happens if the user does X?
* How do we handle empty states, errors, or offline mode?

## Constraints
Any given constraints for the current issue. This section is optional.

## References
Add references to documentation, links, designs, anything that can help to the development of the current task. This section is optional
```

### Guidance for filling out the template:
1. **Gather Information:** If the user hasn't provided enough information to fill out these sections, ask clarifying questions before creating the issue. 
2. **Avoid Technical Prescriptions:** Do not include specific code files, database schema details, or function names unless the user explicitly requests a technical specification instead of a product issue.
3. **Focus on Behavior:** The "User Flows" section should serve as Acceptance Criteria.

Always ensure the title of the issue is concise and accurately reflects the core problem or solution.